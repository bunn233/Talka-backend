import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { decryptToken } from "@/lib/encryption";

export async function POST(req) {
  try {
    const update = await req.json();

    if (update.message) {
      const tgUserId = update.message.from.id.toString();
      const firstName = update.message.from.first_name || "";
      const lastName = update.message.from.last_name || "";
      const tgName = `${firstName} ${lastName}`.trim() || "Telegram User";
      const messageId = update.message.message_id.toString();

      // 1. ดึงค่า channel_id จาก URL (?channel_id=...)
      const { searchParams } = new URL(req.url);
      const channelIdQuery = searchParams.get("channel_id");

      // 2. หาบอทให้ตรงตัวเป๊ะๆ ป้องกันแชทตีกัน
      const channel = await prisma.channel.findFirst({
        where: {
          platform_name: "TELEGRAM",
          status: "CONNECTED",
          ...(channelIdQuery ? { channel_id: parseInt(channelIdQuery) } : {})
        },
      });

      // 🟢 เช็คให้ชัวร์ว่า Channel นี้มีเจ้าของ (Workspace)
      if (!channel || !channel.workspace_id) return new NextResponse("OK", { status: 200 });

      let messageType = "TEXT";
      let content = "";

      if (update.message.photo) {
        const photos = update.message.photo;
        const fileId = photos[photos.length - 1].file_id;
        content = `/api/telegram/file/${channel.channel_id}/${fileId}`;
        messageType = "IMAGE";
      } else if (update.message.text) {
        content = update.message.text;
      } else {
        return new NextResponse("OK", { status: 200 });
      }

      let customerImg = null;
      try {
        // ถอดรหัส Token ให้อ่านออกก่อน
        const realToken = decryptToken(channel.telegram_bot_token);

        const photosRes = await fetch(
          `https://api.telegram.org/bot${realToken}/getUserProfilePhotos?user_id=${tgUserId}&limit=1`,
        );
        const photosData = await photosRes.json();
        if (photosData.ok && photosData.result.total_count > 0) {
          const avatarFileId = photosData.result.photos[0][0].file_id;
          customerImg = `/api/telegram/file/${channel.channel_id}/${avatarFileId}`;
        }
      } catch (e) { }

      let socialAccount = await prisma.customerSocialAccount.findFirst({
        where: { account_identifier: tgUserId, channel_id: channel.channel_id },
        include: { customer: true },
      });

      let customerId;
      if (!socialAccount) {
        const newCustomer = await prisma.customer.create({
          data: {
            workspace_id: channel.workspace_id, // 🟢 [แก้ไข 1] เพิ่มการระบุ Workspace
            name: tgName,
            image: customerImg,
            social_accounts: {
              create: {
                account_identifier: tgUserId,
                channel_id: channel.channel_id,
              },
            },
          },
        });
        customerId = newCustomer.customer_id;
      } else {
        customerId = socialAccount.customer_id;

        const updateData = { name: tgName };
        if (customerImg) updateData.image = customerImg;

        await prisma.customer.update({
          where: { customer_id: customerId },
          data: updateData,
        });

        if (!customerImg) customerImg = socialAccount.customer.image;
      }

      let session = await prisma.chatSession.findFirst({
        where: {
          customer_id: customerId,
          channel_id: channel.channel_id,
          status: { in: ["NEW", "OPEN", "PENDING"] },
        },
      });

      let isNewSession = false;
      if (!session) {
        // 🟢 [แก้ไข 2] ทำให้ Column ID ไม่ซ้ำกันข้ามบริษัท
        const defaultColumnId = `col-inbox-${channel.workspace_id}`;

        await prisma.boardColumn.upsert({
          where: { column_id: defaultColumnId },
          update: {},
          create: {
            column_id: defaultColumnId,
            workspace_id: channel.workspace_id,
            title: "Inbox",
            order_index: 0
          },
        });

        session = await prisma.chatSession.create({
          data: {
            customer_id: customerId,
            channel_id: channel.channel_id,
            board_column_id: defaultColumnId,
            status: "NEW"
          },
        });
        isNewSession = true;
      }

      const isMsgExist = await prisma.message.findUnique({
        where: { external_id: messageId },
      });

      if (!isMsgExist) {
        const savedMessage = await prisma.message.create({
          data: {
            chat_session_id: session.chat_session_id,
            sender_type: "CUSTOMER",
            message_type: messageType,
            content: content,
            external_id: messageId,
          },
        });

        if (channel.workspace_id) {
          if (isNewSession) {
            await pusherServer.trigger(`workspace-${channel.workspace_id}`, 'new-customer-chat', {
              id: session.chat_session_id,
              name: tgName,
              profile: customerImg || "/images/default-avatar.png",
              platform: "TELEGRAM",
              message: content,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              type: "CHAT"
            });
          }

          await pusherServer.trigger(`workspace-${channel.workspace_id}`, 'webhook-event', {
            action: "SYNC_MESSAGE",
            chatId: session.chat_session_id,
            name: tgName,
            imgUrl: customerImg,
            from: "customer",
            text: content,
            type: messageType,
            timestamp: savedMessage.created_at,
            platform: "TELEGRAM",
          });
        }

        // ==========================================
        // 🤖 โซน AI AUTO-REPLY
        // ==========================================
        if (messageType === "TEXT" && session.ai_agent_id) {
          try {
            // 1. ดึงข้อมูล Agent
            const agent = await prisma.aiAgent.findUnique({
              where: { id: session.ai_agent_id }
            });

            if (agent) {
              // 2. ประกอบ Prompt
              let finalSystemPrompt = `[CORE INSTRUCTIONS]\n${agent.instructions || ''}\n\n[TONE OF VOICE]\nMaintain a ${agent.tone || 'professional'} tone.\n\n[STRICT GUARDRAILS]\n${agent.guardrails || ''}`;
              if (agent.lead_gen?.enabled) finalSystemPrompt += `\n\n[ACTION: LEAD GENERATION]\n${agent.lead_gen?.prompt || ''}`;
              if (agent.handover?.enabled) finalSystemPrompt += `\n\n[FALLBACK]\nIf unsure, reply exactly: "${agent.handover?.fallbackMsg || ''}"`;

              // 3. ส่งให้ Dify ประมวลผล
              const difyResponse = await fetch('https://api.dify.ai/v1/chat-messages', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  inputs: { custom_prompt: finalSystemPrompt },
                  query: content, // ส่งข้อความลูกค้าไป
                  response_mode: "blocking",
                  user: `telegram-${tgUserId}`
                })
              });

              const difyData = await difyResponse.json();
              const aiReplyText = difyData.answer;

              const totalTokens = difyData.metadata?.usage?.total_tokens || 0;
              const totalPrice = parseFloat(difyData.metadata?.usage?.total_price || 0);

              if (totalTokens > 0 && channel.workspace_id) {
                await prisma.aiTokenLog.create({
                  data: {
                    workspace_id: channel.workspace_id,
                    feature_name: agent.name,
                    tokens_used: totalTokens,
                    estimated_cost: totalPrice
                  }
                }).catch(e => console.error("Token log error:", e));
              }

              if (aiReplyText) {
                // 4. ถอดรหัส Token และส่งข้อความกลับหาลูกค้าผ่าน Telegram
                const botTokenForReply = decryptToken(channel.telegram_bot_token);
                await fetch(`https://api.telegram.org/bot${botTokenForReply}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: tgUserId,
                    text: aiReplyText
                  })
                });

                // 5. บันทึกคำตอบ AI ลง Database ของเรา
                const savedAiMessage = await prisma.message.create({
                  data: {
                    chat_session_id: session.chat_session_id,
                    content: aiReplyText,
                    sender_type: "AGENT",
                    message_type: "TEXT"
                  }
                });

                // 6. ส่ง Pusher แจ้งให้หน้าเว็บอัปเดตแบบเรียลไทม์
                if (channel.workspace_id) {
                  await pusherServer.trigger(`workspace-${channel.workspace_id}`, 'webhook-event', {
                    action: "SYNC_MESSAGE",
                    chatId: session.chat_session_id,
                    name: agent.name,
                    imgUrl: null,
                    text: aiReplyText,
                    from: "agent",
                    type: "TEXT",
                    timestamp: savedAiMessage.created_at,
                    platform: "TELEGRAM",
                  });
                }
              }
            }
          } catch (aiError) {
            console.error("AI Auto-Reply Error:", aiError);
          }
        }
        // ==========================================

      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    return new NextResponse("Error", { status: 200 });
  }
}