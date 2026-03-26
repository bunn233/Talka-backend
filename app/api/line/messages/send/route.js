import { prisma } from "@/lib/prisma";
import { Client } from "@line/bot-sdk";

const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

/**
 * @swagger
 * /api/line/messages/send:
 *   post:
 *     tags:
 *       - Messages
 *     summary: Send a message to a LINE chat
 *     description: Send a text message to a customer via LINE and save it to the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chat_session_id
 *               - text
 *             properties:
 *               chat_session_id:
 *                 type: string
 *                 description: The chat session ID to send the message to
 *               text:
 *                 type: string
 *                 description: The message text to send
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Missing required fields or no LINE account linked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Chat session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error or LINE API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const { chat_session_id, text } = body;

        if (!chat_session_id || !text?.trim()) {
            return Response.json(
                { error: "Missing chat_session_id or text" },
                { status: 400 }
            );
        }

        // 1️⃣ ดึง Chat Session และหา LINE User ID
        const chatSession = await prisma.chatSession.findUnique({
            where: { chat_session_id: parseInt(chat_session_id) },
            include: {
                customer: {
                    include: {
                        social_accounts: {
                            where: {
                                platform: { platform_name: "LINE" }
                            }
                        }
                    }
                }
            }
        });

        if (!chatSession) {
            return Response.json(
                { error: "Chat session not found" },
                { status: 404 }
            );
        }

        // 2️⃣ หา LINE User ID
        const socialAccount = chatSession.customer.social_accounts?.[0];
        if (!socialAccount) {
            return Response.json(
                { error: "No LINE account linked to customer" },
                { status: 400 }
            );
        }

        // 3️⃣ ส่งข้อความไป LINE จริง
        try {
            await lineClient.pushMessage(socialAccount.account_identifier, {
                type: "text",
                text: text,
            });
            console.log(`✅ Message sent to LINE user: ${socialAccount.account_identifier}`);
        } catch (lineError) {
            console.error("❌ LINE API Error:", lineError);
            return Response.json(
                { error: "Failed to send message to LINE" },
                { status: 500 }
            );
        }

        // 4️⃣ บันทึกข้อความในฐานข้อมูล
        await prisma.message.create({
            data: {
                chat_session_id,
                content: text,
                sender_type: "AGENT",
                message_type: "TEXT",
            },
        });

        // 5️⃣ Broadcast ให้ Frontend รู้ผ่าน SSE
        const globalClients = globalThis.sseClients || [];
        globalClients.forEach((res) => {
            try {
                res.write(
                    `data: ${JSON.stringify({
                        chatId: chat_session_id,
                        text,
                        from: "AGENT",
                        timestamp: new Date().toISOString()
                    })}\n\n`
                );
            } catch (error) {
                console.error("Error broadcasting:", error);
            }
        });

        return Response.json({ success: true });

    } catch (err) {
        console.error("❌ Send message error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}