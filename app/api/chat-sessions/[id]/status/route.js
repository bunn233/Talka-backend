import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma"; 
import { pusherServer } from "@/lib/pusher";
import { dbLog } from "@/lib/dbLogger";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request, context) {
    try {
        const params = await context.params;
        const id = parseInt(params.id);
        const { status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing chat ID or status' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        let currentUserId = 1;
        if (session?.user?.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (dbUser) currentUserId = dbUser.user_id;
        }

        const updatedChat = await prisma.chatSession.update({
            where: { chat_session_id: id },
            data: { status: status },
            include: { channel: { select: { workspace_id: true } } } 
        });

        await dbLog({
            action: "change_status",
            new_value: status,
            chat_session_id: id,
            user_id: currentUserId
        });

        if (updatedChat.channel?.workspace_id) {
            try {
                const wsChannel = `workspace-${updatedChat.channel.workspace_id}`;
                await pusherServer.trigger(wsChannel, 'chat-details-updated', {
                    chatId: id,
                    message: "เปลี่ยนสถานะแชท (Status) แล้ว"
                });
                await pusherServer.trigger(wsChannel, "log-updated", { chatId: id });
            } catch (e) {
                console.error("Pusher Error:", e);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Status updated successfully',
            chat: updatedChat
        });

    } catch (error) {
        console.error('❌ Update status error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}