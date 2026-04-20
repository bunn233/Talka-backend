import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { decryptToken } from '@/lib/encryption';

export async function POST(req, { params }) {
    try {
        const resolvedParams = await params; 
        const chatId = parseInt(resolvedParams.chatId);
        
        const body = await req.json();
        const { ai_agent_id } = body;

        // 1. อัปเดต Database ว่าแชทนี้ใครเป็นคนคุม (คน หรือ AI)
        const chatSession = await prisma.chatSession.update({
            where: { chat_session_id: chatId },
            data: { ai_agent_id: ai_agent_id },
            include: {
                channel: true,
                customer: { include: { social_accounts: true } }
            }
        });

        // ==========================================
        // 🤖 2. ถ้าเปิดโหมด AI ให้ส่ง Greeting Message ทันที!
        // ==========================================
        if (ai_agent_id) {
            // ดึงข้อมูล AI เพื่อเอาข้อความทักทาย
            const agent = await prisma.aiAgent.findUnique({
                where: { id: ai_agent_id }
            });

            // รองรับทั้งชื่อฟิลด์ greeting หรือ greetingMsg
            const greetingText = agent?.greetingMsg || agent?.greeting;

            if (agent && greetingText) {
                const platformName = chatSession.channel.platform_name.toUpperCase();
                const socialAccount = chatSession.customer.social_accounts.find(
                    (acc) => acc.channel_id === chatSession.channel_id
                );
                const recipientId = socialAccount?.account_identifier;

                if (recipientId) {
                    let token = null;
                    if (platformName === "FACEBOOK" || platformName === "INSTAGRAM") {
                        token = decryptToken(chatSession.channel.fb_page_access_token);
                    } else if (platformName === "LINE") {
                        token = decryptToken(chatSession.channel.line_access_token);
                    } else if (platformName === "TELEGRAM") {
                        token = decryptToken(chatSession.channel.telegram_bot_token);
                    }

                    let sentSuccess = false;

                    // 🗣️ ปาก: ส่งข้อความไปหาลูกค้าตาม Platform
                    if (platformName === "LINE" && token) {
                        const res = await fetch("https://api.line.me/v2/bot/message/push", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token.trim()}`,
                            },
                            body: JSON.stringify({
                                to: recipientId,
                                messages: [{ type: "text", text: greetingText }],
                            }),
                        });
                        if (res.ok) sentSuccess = true;
                    } 
                    else if (platformName === "TELEGRAM" && token) {
                        const res = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ chat_id: recipientId, text: greetingText }),
                        });
                        if (res.ok) sentSuccess = true;
                    } 
                    else if ((platformName === "FACEBOOK" || platformName === "INSTAGRAM") && token) {
                        const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${token.trim()}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ recipient: { id: recipientId }, message: { text: greetingText } }),
                        });
                        if (res.ok) sentSuccess = true;
                    }

                    // 💾 ถ้าส่งสำเร็จ ให้เซฟลง DB และแจ้งเตือนหน้าจอพนักงาน (Pusher)
                    if (sentSuccess) {
                        const savedMsg = await prisma.message.create({
                            data: {
                                chat_session_id: chatId,
                                content: greetingText,
                                sender_type: "AGENT",
                                message_type: "TEXT"
                            }
                        });

                        if (chatSession.channel.workspace_id) {
                            await pusherServer.trigger(`workspace-${chatSession.channel.workspace_id}`, 'webhook-event', {
                                action: "SYNC_MESSAGE",
                                chatId: chatId,
                                name: agent.name,
                                imgUrl: null, // ให้หน้าเว็บเรนเดอร์ไอคอนบอทแทน
                                text: greetingText,
                                from: "agent",
                                type: "TEXT",
                                timestamp: savedMsg.created_at,
                                platform: platformName,
                            });
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("Update AI Mode Error:", error);
        return NextResponse.json({ error: "ไม่สามารถอัปเดตโหมด AI ได้" }, { status: 500 });
    }
}