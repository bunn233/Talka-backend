import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { decryptToken } from "@/lib/encryption";

export async function POST(req) {
  try {
    const body = await req.json();
    const isInstagram = body.object === "instagram";
    const isPage = body.object === "page";

    if (!isInstagram && !isPage) return new NextResponse("OK", { status: 200 });

    for (const entry of body.entry) {
      if (!entry.messaging) continue;
      const webhook_event = entry.messaging[0];

      // กรณี Unsend
      if (webhook_event.unsends) {
        const mid = webhook_event.unsends.mid;
        const targetMsg = await prisma.message.findUnique({
          where: { external_id: mid },
          include: { chat: { select: { channel: { select: { workspace_id: true } } } } }
        });

        if (targetMsg) {
          await prisma.message.update({
            where: { message_id: targetMsg.message_id },
            data: { content: "🚫 ข้อความถูกยกเลิก", message_type: "TEXT" },
          });
          
          if (targetMsg.chat?.channel?.workspace_id) {
            await pusherServer.trigger(`workspace-${targetMsg.chat.channel.workspace_id}`, 'webhook-event', {
              action: "DELETE_MESSAGE",
              chatId: targetMsg.chat_session_id,
              messageId: mid,
              text: "🚫 ข้อความถูกยกเลิก",
            });
          }
        }
        continue;
      }

      // กรณี Edit
      if (webhook_event.message_edit) {
        const mid = webhook_event.message_edit.mid;
        const newText = webhook_event.message_edit.text || "";

        const existingMessage = await prisma.message.findUnique({
          where: { external_id: mid },
          include: { chat: { select: { channel: { select: { workspace_id: true } } } } }
        });

        if (existingMessage) {
          await prisma.message.update({
            where: { message_id: existingMessage.message_id },
            data: { content: newText },
          });
          
          if (existingMessage.chat?.channel?.workspace_id) {
            await pusherServer.trigger(`workspace-${existingMessage.chat.channel.workspace_id}`, 'webhook-event', {
              action: "EDIT_MESSAGE",
              chatId: existingMessage.chat_session_id,
              messageId: mid,
              text: newText,
            });
          }
        }
        continue;
      }

      // กรณี Message ใหม่
      if (webhook_event.message) {
        if (webhook_event.message.is_echo) continue;

        const mid = webhook_event.message.mid;
        const text = webhook_event.message.text || "";

        let messageType = "TEXT";
        let content = text;

        if (webhook_event.message.attachments) {
          const attachment = webhook_event.message.attachments[0];
          if (attachment.type === "image") {
            content = attachment.payload.url;
            messageType = "IMAGE";
          } else {
            content = `[ส่งไฟล์ ${attachment.type}]`;
          }
        }
        if (content.includes("lookaside.fbsbx.com") || content.includes("cdninstagram.com")) {
            messageType = "IMAGE";
        }

        const channel = await prisma.channel.findFirst({
          where: { 
            fb_page_id: entry.id,
            status: "CONNECTED" 
          },
        });
        if (!channel) continue;

        const senderId = webhook_event.sender.id;
        const platformName = isInstagram ? "INSTAGRAM" : "FACEBOOK";

        let profileName = `${platformName} User ${senderId.substring(0, 5)}`;
        let profilePic = "";
        let cleanToken = ""; // เลื่อนตัวแปรนี้ขึ้นมา เพื่อให้ส่งข้อความ AI กลับไปได้

        try {
          const fields = isInstagram
            ? "name,profile_pic"
            : "first_name,last_name,profile_pic";
          
          //  2. ถอดรหัส Access Token ให้ใช้งานได้
          const realAccessToken = decryptToken(channel.fb_page_access_token);
          cleanToken = realAccessToken.trim().replace(/[\n\r]/g, "");

          const res = await fetch(
            `https://graph.facebook.com/v21.0/${senderId}?fields=${fields}&access_token=${cleanToken}`
          );
          const d = await res.json();
          if (res.ok) {
            if (isInstagram) {
              profileName = d.name || profileName;
            } else {
              profileName = `${d.first_name || ""} ${d.last_name || ""}`.trim() || profileName;
            }
            profilePic = d.profile_pic || "";
          }
        } catch (e) {}

        const socialAcc = await prisma.customerSocialAccount.findFirst({
          where: {
            account_identifier: senderId,
            channel_id: channel.channel_id, 
          },
        });

        let customerId;
        if (!socialAcc) {
          const newCust = await prisma.customer.create({
            data: {
              name: profileName,
              image: profilePic,
              social_accounts: {
                create: {
                  channel_id: channel.channel_id,
                  account_identifier: senderId,
                },
              },
            },
          });
          customerId = newCust.customer_id;
        } else {
          customerId = socialAcc.customer_id;
          await prisma.customer.update({
            where: { customer_id: customerId },
            data: { name: profileName, image: profilePic },
          });
        }

        let chat = await prisma.chatSession.findFirst({
          where: {
            customer_id: customerId,
            channel_id: channel.channel_id,
            status: { in: ["NEW", "OPEN", "PENDING"] },
          },
        });

        //  ดักจับว่าเป็นแชทใหม่ป่าว
        let isNewSession = false;
        if (!chat) {
          await prisma.boardColumn.upsert({
            where: { column_id: "col-1" },
            update: {},
            create: { column_id: "col-1", title: "Inbox", order_index: 0 }
          });

          chat = await prisma.chatSession.create({ 
            data: { 
              customer_id: customerId, 
              channel_id: channel.channel_id,
              status: "NEW",
              board_column_id: "col-1" 
            } 
          });
          isNewSession = true;
        }

        const isMsgExist = await prisma.message.findUnique({
            where: { external_id: mid }
        });

        if (!isMsgExist) {
            await prisma.message.create({
              data: {
                chat_session_id: chat.chat_session_id,
                content: content,
                external_id: mid,
                sender_type: "CUSTOMER",
                message_type: messageType,
              },
            });

            if (channel.workspace_id) {
              if (isNewSession) {
                 await pusherServer.trigger(`workspace-${channel.workspace_id}`, 'new-customer-chat', {
                     id: chat.chat_session_id,
                     name: profileName,
                     profile: profilePic || "/images/default-avatar.png",
                     platform: platformName,
                     message: content,
                     time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                     type: "CHAT"
                 });
              }

              // แจ้งเตือนข้อความใหม่ปกติ
              await pusherServer.trigger(`workspace-${channel.workspace_id}`, 'webhook-event', {
                action: "SYNC_MESSAGE",
                id: chat.chat_session_id,
                chatId: chat.chat_session_id,
                name: profileName,
                imgUrl: profilePic,
                text: content,
                type: messageType,
                messageId: mid,
                from: "customer",
                platform: platformName,
                timestamp: new Date().toISOString(),
              });
            }

            // ==========================================
            // 🤖 โซน AI AUTO-REPLY (เชื่อม Dify สำหรับ Facebook/Instagram)
            // ==========================================
            if (messageType === "TEXT" && chat.ai_agent_id && cleanToken) {
              try {
                // 1. ดึงข้อมูล Agent
                const agent = await prisma.aiAgent.findUnique({
                  where: { id: chat.ai_agent_id }
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
                      query: content, // ข้อความที่ลูกค้าพิมพ์มา
                      response_mode: "blocking",
                      user: `meta-${senderId}` // แยกว่ามาจาก FB/IG
                    })
                  });

                  const difyData = await difyResponse.json();
                  const aiReplyText = difyData.answer;

                  if (aiReplyText) {
                    // 4. ปาก: ส่งคำตอบกลับหาลูกค้าผ่าน Facebook Graph API
                    const metaBaseUrl = `https://graph.facebook.com/v21.0/me/messages?access_token=${cleanToken}`;
                    await fetch(metaBaseUrl, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        recipient: { id: senderId },
                        message: { text: aiReplyText },
                      }),
                    });

                    // 5. บันทึกคำตอบ AI ลง Database
                    const savedAiMessage = await prisma.message.create({
                      data: {
                        chat_session_id: chat.chat_session_id,
                        content: aiReplyText,
                        sender_type: "AGENT",
                        message_type: "TEXT"
                      }
                    });

                    // 6. แจ้งหน้าเว็บให้แชทอัปเดตแบบเรียลไทม์
                    if (channel.workspace_id) {
                      await pusherServer.trigger(`workspace-${channel.workspace_id}`, 'webhook-event', {
                        action: "SYNC_MESSAGE",
                        chatId: chat.chat_session_id,
                        name: agent.name,
                        imgUrl: null, // ให้หน้าเว็บโชว์ไอคอนบอทแทน
                        text: aiReplyText,
                        from: "agent",
                        type: "TEXT",
                        platform: platformName,
                        timestamp: savedAiMessage.created_at,
                      });
                    }
                  }
                }
              } catch (aiError) {
                console.error("Meta AI Auto-Reply Error:", aiError);
              }
            }
            // ==========================================

        }
      }
    }
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new NextResponse("Error", { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("hub.mode") === "subscribe" && searchParams.get("hub.verify_token") === process.env.FACEBOOK_VERIFY_TOKEN) {
    return new NextResponse(searchParams.get("hub.challenge"), { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}