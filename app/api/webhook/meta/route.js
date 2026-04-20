import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { decryptToken } from "@/lib/encryption";

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature");

    // 1. ดึงค่า channel_id จาก URL
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

    if (!channel || !channel.workspace_id) return new Response("Config Error", { status: 404 });

    // 3. ถอดรหัส Secret ก่อนเอาไปคำนวณ Hmac
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
        const replyToken = event.replyToken;
        let msgContent = "";

        // 🟢 [แก้ไข 1] แนบ channel_id ไปกับ Image Proxy
        if (messageType === "text") {
          msgContent = event.message.text;
        } else if (messageType === "image") {
          msgContent = `/api/line/image/${event.message.id}?channelId=${channel.channel_id}`;
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
            const realAccessToken = decryptToken(channel.line_access_token);
            const profileRes = await fetch(
              `https://api.line.me/v2/bot/profile/${lineUserId}`,
              { headers: { Authorization: `Bearer ${realAccessToken}` } },
            );
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              customerName = profileData.displayName;
              customerImg = profileData.pictureUrl;
            }
          } catch (e) {}

          if (!socialAccount) {
            // 🟢 [แก้ไข 2] ใส่ workspace_id ให้ลูกค้าใหม่
            const newCust = await prisma.customer.create({
              data: {
                workspace_id: channel.workspace_id, 
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
          // 🟢 [แก้ไข 3] ทำให้ Column ID ไม่ซ้ำกันข้ามบริษัท
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

          chat = await prisma.chatSession.create({
            data: {
              customer_id: currentCustomerId,
              channel_id: channel.channel_id,
              status: "NEW",
              board_column_id: defaultColumnId,
            },
          });
          isNewSession = true;
        }

        await prisma.message.create({
          data: {
            chat_session_id: chat.chat_session_id,
            content: msgContent,
            sender_type: "CUSTOMER",
            message_type: messageType.toUpperCase(),
          },
        });

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
        if (messageType === "text" && chat.ai_agent_id) {
          try {
            const agent = await prisma.aiAgent.findUnique({
              where: { id: chat.ai_agent_id }
            });

            if (agent) {
              let finalSystemPrompt = `[CORE INSTRUCTIONS]\n${agent.instructions || ''}\n\n[TONE OF VOICE]\nMaintain a ${agent.tone || 'professional'} tone.\n\n[STRICT GUARDRAILS]\n${agent.guardrails || ''}`;
              if (agent.lead_gen?.enabled) finalSystemPrompt += `\n\n[ACTION: LEAD GENERATION]\n${agent.lead_gen?.prompt || ''}`;
              if (agent.handover?.enabled) finalSystemPrompt += `\n\n[FALLBACK]\nIf unsure, reply exactly: "${agent.handover?.fallbackMsg || ''}"`;

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

              // 🟢 [แก้ไข 4] เก็บข้อมูล Token ส่งเข้า Database สำหรับทำ Report
              const totalTokens = difyData.metadata?.usage?.total_tokens || 0;
              const totalPrice = difyData.metadata?.usage?.total_price || 0;

              if (totalTokens > 0 && channel.workspace_id) {
                // เช็คก่อนว่าคุณสร้างตาราง AiTokenLog ใน schema.prisma แล้วหรือยัง
                // ถ้ายังให้ comment โค้ดส่วนนี้ไว้ก่อนนะครับ
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

                await prisma.message.create({
                  data: {
                    chat_session_id: chat.chat_session_id,
                    content: aiReplyText,
                    sender_type: "AGENT",
                    message_type: "TEXT"
                  }
                });

                if (channel.workspace_id) {
                  await pusherServer.trigger(
                    `workspace-${channel.workspace_id}`,
                    "webhook-event",
                    {
                      action: "SYNC_MESSAGE",
                      chatId: chat.chat_session_id,
                      name: agent.name,
                      imgUrl: null,
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
            console.error("AI Auto-Reply Error:", aiError);
          }
        }

      }),
    );

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response("Error", { status: 200 });
  }
}