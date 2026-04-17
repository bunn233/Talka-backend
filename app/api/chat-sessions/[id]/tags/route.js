import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { pusherServer } from "@/lib/pusher";
import { dbLog } from "@/lib/dbLogger";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req, context) {
    try {
        const params = await context.params;
        const chatId = parseInt(params.id); 
        const { tagId, tagName } = await req.json();

        if (!tagId || !chatId) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        let currentUserId = 1;
        if (session?.user?.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (dbUser) currentUserId = dbUser.user_id;
        }

        const chatSession = await prisma.chatSession.findUnique({
            where: { chat_session_id: chatId },
            select: { channel: { select: { workspace_id: true } } }
        });

        const existingChatTag = await prisma.chatTag.findFirst({
            where: { chat_session_id: chatId, tag_id: parseInt(tagId) }
        });

        let actionType = "added";

        if (existingChatTag) {
            await prisma.chatTag.deleteMany({
                where: { chat_session_id: chatId, tag_id: parseInt(tagId) }
            });
            actionType = "removed";
            
            await dbLog({
                action: "remove_tag",
                old_value: tagName || `Tag ID: ${tagId}`,
                chat_session_id: chatId,
                user_id: currentUserId
            });
        } else {
            await prisma.chatTag.create({
                data: { chat_session_id: chatId, tag_id: parseInt(tagId) }
            });
            
            await dbLog({
                action: "add_tag",
                new_value: tagName || `Tag ID: ${tagId}`,
                chat_session_id: chatId,
                user_id: currentUserId
            });
        }

        if (chatSession?.channel?.workspace_id) {
            try {
                const wsChannel = `workspace-${chatSession.channel.workspace_id}`;
                await pusherServer.trigger(wsChannel, 'chat-details-updated', {
                    chatId: chatId,
                    message: `Tag ถูก ${actionType}`
                });
                await pusherServer.trigger(wsChannel, "log-updated", { chatId: chatId });
            } catch (e) {
                console.error("Pusher Error:", e);
            }
        }

        return NextResponse.json({ action: actionType, tagId });

    } catch (error) {
        console.error("❌ Tag API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}