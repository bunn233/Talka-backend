import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { pusherServer } from "@/lib/pusher";

export async function POST(req, context) {
    try {
        const params = await context.params;
        const chatId = parseInt(params.id); 
        const { tagId } = await req.json();

        if (!tagId || !chatId) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        const chatSession = await prisma.chatSession.findUnique({
            where: { chat_session_id: chatId },
            select: { channel: { select: { workspace_id: true } } }
        });

        const existingChatTag = await prisma.chatTag.findFirst({
            where: {
                chat_session_id: chatId,
                tag_id: parseInt(tagId)
            }
        });

        let actionType = "added";

        if (existingChatTag) {
            await prisma.chatTag.deleteMany({
                where: { 
                    chat_session_id: chatId,
                    tag_id: parseInt(tagId)
                }
            });
            actionType = "removed";
        } else {
            await prisma.chatTag.create({
                data: {
                    chat_session_id: chatId,
                    tag_id: parseInt(tagId)
                }
            });
        }

        // 3. ตะโกนบอก Pusher
        if (chatSession?.channel?.workspace_id) {
            try {
                await pusherServer.trigger(`workspace-${chatSession.channel.workspace_id}`, 'chat-details-updated', {
                    chatId: chatId,
                    message: `Tag ถูก ${actionType}`
                });
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