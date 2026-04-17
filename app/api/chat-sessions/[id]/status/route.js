import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma"; 
import { pusherServer } from "@/lib/pusher";

export async function PATCH(request, context) {
    try {
        const params = await context.params;
        const id = parseInt(params.id);
        const { status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing chat ID or status' }, { status: 400 });
        }

        const updatedChat = await prisma.chatSession.update({
            where: { chat_session_id: id },
            data: { status: status },
            include: { channel: { select: { workspace_id: true } } } 
        });

        if (updatedChat.channel?.workspace_id) {
            try {
                await pusherServer.trigger(`workspace-${updatedChat.channel.workspace_id}`, 'chat-details-updated', {
                    chatId: id,
                    message: "เปลี่ยนสถานะแชท (Status) แล้ว"
                });
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