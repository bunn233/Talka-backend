import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { decryptToken } from "@/lib/encryption";

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature");

    //  1. ดึงค่า channel_id จาก URL
    const { searchParams } = new URL(req.url);
    const channelIdQuery = searchParams.get("channel_id");

    // 2. หาบอทให้ตรงตัวเป๊ะๆ
    const channel = await prisma.channel.findFirst({
      where: { 
          platform_name: "LINE",
          ...(channelIdQuery ? { channel_id: parseInt(channelIdQuery) } : {}) 
      },
      orderBy: { channel_id: "desc" },
    });

    //if (!channel) return new Response("Config Error", { status: 404 });

    // 2. ถอดรหัส Secret ก่อนเอาไปคำนวณ Hmac
    const realChannelSecret = decryptToken(channel.line_channel_secret);

    const hash = crypto
      .createHmac("sha256", realChannelSecret)
      .update(body, "utf8")
      .digest("base64");
    if (hash !== signature)
      return new Response("Unauthorized", { status: 401 });

    const data = JSON.parse(body);
    if (!data.events) return new Response("OK", { status: 200 });

    await Promise.all(
      data.events.map(async (event) => {
        if (event.type !== "message") return;

        const lineUserId = event.source.userId;
        const messageType = event.message.type;
        const replyToken = event.replyToken; // ดึง Reply Token ไว้ใช้ตอบกลับ
        let msgContent = "";

        if (messageType === "text") {
          msgContent = event.message.text;
        } else if (messageType === "image") {
          msgContent = `/api/line/image/${event.message.id}`;
        } else {
          return;
        }

        let socialAccount = await prisma.customerSocialAccount.findFirst({
          where: {
            account_identifier: lineUserId,
            channel_id: channel.channel_id,
          },
          include: { customer: true },
        });

        let currentCustomerId, customerName, customerImg;

        if (!socialAccount || !socialAccount.customer.image) {
          try {
            //  3. ถอดรหัส Access Token ก่อนเอาไปยิงขอรูปโปรไฟล์
            const realAccessToken = decryptToken(channel.line_access_token);

            const profileRes = await fetch(
              `https://api.line.me/v2/bot/profile/${lineUserId}`,
              {
                headers: {
                  Authorization: `Bearer ${realAccessToken}`,
                },
              },
            );
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              customerName = profileData.displayName;
              customerImg = profileData.pictureUrl;
            }
          } catch (e) {}

          if (!socialAccount) {
            const newCust = await prisma.customer.create({
              data: {
                name: customerName || "LINE User",
                image: customerImg,
                social_accounts: {
                  create: {
                    channel_id: channel.channel_id,
                    account_identifier: lineUserId,
                  },
                },
              },
            });
            currentCustomerId = newCust.customer_id;
          } else {
            await prisma.customer.update({
              where: { customer_id: socialAccount.customer_id },
              data: { image: customerImg },
            });
            currentCustomerId = socialAccount.customer_id;
          }
        } else {
          currentCustomerId = socialAccount.customer_id;
          customerName = socialAccount.customer.name;
          customerImg = socialAccount.customer.image;
        }

        let chat = await prisma.chatSession.findFirst({
          where: {
            customer_id: currentCustomerId,
            channel_id: channel.channel_id,
            status: { in: ["NEW", "OPEN", "PENDING"] },
          },
        });

        let isNewSession = false;
        if (!chat) {
          await prisma.boardColumn.upsert({
            where: { column_id: "col-1" },
            update: {},
            create: { column_id: "col-1", title: "Inbox", order_index: 0 },
          });

          chat = await prisma.chatSession.create({
            data: {
              customer_id: currentCustomerId,
              channel_id: channel.channel_id,
              status: "NEW",
              board_column_id: "col-1",
            },
          });
          isNewSession = true;
        }

        // เซฟข้อความของลูกค้าลง DB
        await prisma.message.create({
          data: {
            chat_session_id: chat.chat_session_id,
            content: msgContent,
            sender_type: "CUSTOMER",
            message_type: messageType.toUpperCase(),
          },
        });

        // ดันข้อมูลแจ้งเตือนพนักงาน (Pusher) ของฝั่งลูกค้า
        if (channel.workspace_id) {
          if (isNewSession) {
            await pusherServer.trigger(
              `workspace-${channel.workspace_id}`,
              "new-customer-chat",
              {
                id: chat.chat_session_id,
                name: customerName || "LINE User",
                profile: customerImg || "/images/default-avatar.png",
                platform: "LINE",
                message: msgContent,
                time: new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                type: "CHAT",
              },
            );
          }

          await pusherServer.trigger(
            `workspace-${channel.workspace_id}`,
            "webhook-event",
            {
              action: "SYNC_MESSAGE",
              chatId: chat.chat_session_id,
              name: customerName,
              imgUrl: customerImg,
              text: msgContent,
              from: "customer",
              type: messageType.toUpperCase(),
              platform: "LINE",
              timestamp: new Date().toISOString(),
            },
          );
        }

        // ==========================================
        // 🤖 โซน AI AUTO-REPLY
        // ==========================================
        // เช็คว่าเป็นข้อความ Text และแชทนี้มีการตั้งค่าให้ AI ตอบ
        if (messageType === "text" && chat.ai_agent_id) {
          try {
            // 1. หาข้อมูล AI Agent
            const agent = await prisma.aiAgent.findUnique({
              where: { id: chat.ai_agent_id }
            });

            if (agent) {
              // 2. ประกอบ Prompt
              let finalSystemPrompt = `[CORE INSTRUCTIONS]\n${agent.instructions || ''}\n\n[TONE OF VOICE]\nMaintain a ${agent.tone || 'professional'} tone.\n\n[STRICT GUARDRAILS]\n${agent.guardrails || ''}`;
              if (agent.lead_gen?.enabled) finalSystemPrompt += `\n\n[ACTION: LEAD GENERATION]\n${agent.lead_gen?.prompt || ''}`;
              if (agent.handover?.enabled) finalSystemPrompt += `\n\n[FALLBACK]\nIf unsure, reply exactly: "${agent.handover?.fallbackMsg || ''}"`;

              // 3. ส่งไปให้ Dify ประมวลผล
              const difyResponse = await fetch('https://api.dify.ai/v1/chat-messages', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  inputs: { custom_prompt: finalSystemPrompt },
                  query: msgContent,
                  response_mode: "blocking",
                  user: `line-${lineUserId}`
                })
              });

              const difyData = await difyResponse.json();
              const aiReplyText = difyData.answer;

              if (aiReplyText) {
                // 4. ปาก: ส่งคำตอบกลับหาลูกค้าผ่าน LINE
                const realAccessToken = decryptToken(channel.line_access_token);
                await fetch('https://api.line.me/v2/bot/message/reply', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${realAccessToken}`
                  },
                  body: JSON.stringify({
                    replyToken: replyToken,
                    messages: [{ type: 'text', text: aiReplyText }]
                  })
                });

                // 5. เซฟข้อความที่ AI ตอบลง DB
                await prisma.message.create({
                  data: {
                    chat_session_id: chat.chat_session_id,
                    content: aiReplyText,
                    sender_type: "AGENT",
                    message_type: "TEXT"
                  }
                });

                // 6. ดันข้อมูลแจ้งเตือนพนักงาน (Pusher) ให้เห็นว่า AI เพิ่งตอบ
                if (channel.workspace_id) {
                  await pusherServer.trigger(
                    `workspace-${channel.workspace_id}`,
                    "webhook-event",
                    {
                      action: "SYNC_MESSAGE",
                      chatId: chat.chat_session_id,
                      name: agent.name,
                      imgUrl: null, // ปล่อยว่างไว้ให้ UI ไปเรนเดอร์ไอคอนบอท
                      text: aiReplyText,
                      from: "agent",
                      type: "TEXT",
                      platform: "LINE",
                      timestamp: new Date().toISOString(),
                    }
                  );
                }
              }
            }
          } catch (aiError) {
            // ดัก Error ไว้ เพื่อให้ถ้า Dify พัง Webhook จะได้ไม่ล่ม
            console.error("AI Auto-Reply Error:", aiError);
          }
        }
        // ==========================================

      }),
    );

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response("Error", { status: 200 });
  }
}