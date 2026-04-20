import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher"; 

export async function DELETE(req, context) {
    try {
        const params = await context.params;
        const channelId = params.id;

        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action"); // 'disconnect' | 'delete' | 'reconnect'
        const workspaceId = searchParams.get("wsId");

        if (!channelId || !workspaceId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { user_id: true } });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const myWorkspace = await prisma.workspaceMember.findFirst({
            where: { user_id: dbUser.user_id, workspace_id: parseInt(workspaceId) }
        });

        if (!myWorkspace) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // =====================================
        // จัดการปุ่มตาม Action
        // =====================================
        if (action === "delete") {
            const chatSessions = await prisma.chatSession.findMany({ where: { channel_id: parseInt(channelId) }, select: { chat_session_id: true }});
            const sessionIds = chatSessions.map(s => s.chat_session_id);

            await prisma.$transaction([
                prisma.message.deleteMany({ where: { chat_session_id: { in: sessionIds } } }),
                prisma.note.deleteMany({ where: { chat_session_id: { in: sessionIds } } }),
                prisma.assignment.deleteMany({ where: { chat_session_id: { in: sessionIds } } }),
                prisma.chatTag.deleteMany({ where: { chat_session_id: { in: sessionIds } } }),
                prisma.activityLog.deleteMany({ where: { chat_session_id: { in: sessionIds } } }),
                prisma.chatSession.deleteMany({ where: { channel_id: parseInt(channelId) } }),
                prisma.customerSocialAccount.deleteMany({ where: { channel_id: parseInt(channelId) } }),
                prisma.channel.delete({ where: { channel_id: parseInt(channelId) } })
            ]);

        } else if (action === "reconnect") {
            await prisma.channel.update({ where: { channel_id: parseInt(channelId) }, data: { status: "CONNECTED" }});
        } else {
            await prisma.channel.update({ where: { channel_id: parseInt(channelId) }, data: { status: "DISCONNECTED" }});
        }

        try {
           await pusherServer.trigger(`workspace-${workspaceId}`, 'channel-updated', {
              message: "แชแนลโดนเปลี่ยนสถานะ! เตะออกเดี๋ยวนี้!"
           });
        } catch(e) {
           console.log("Pusher Trigger Error:", e);
        }
        
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("❌ DELETE API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}