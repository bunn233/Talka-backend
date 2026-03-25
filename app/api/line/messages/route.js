import axios from "axios";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
    try {
        const { chat_session_id, text } = await req.json();

        const session = await prisma.chatSession.findUnique({
            where: { chat_session_id },
            include: { customer: true },
        });

        const lineUserId = session.customer.external_id;

        // 🔥 ส่งไป LINE
        await axios.post(
            "https://api.line.me/v2/bot/message/push",
            {
                to: lineUserId,
                messages: [{ type: "text", text }],
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
                },
            }
        );

        // 🔥 save admin message
        await prisma.message.create({
            data: {
                chat_session_id,
                sender_type: "AGENT",
                message_type: "TEXT",
                content: text,
            },
        });

        return Response.json({ success: true });

    } catch (err) {
        console.error(err);
        return Response.json({ success: false }, { status: 500 });
    }
}