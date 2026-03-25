import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
    const chatId = parseInt(params.id);

    const messages = await prisma.message.findMany({
        where: { chat_session_id: chatId },
        orderBy: { created_at: "asc" },
    });

    return Response.json(messages);
}