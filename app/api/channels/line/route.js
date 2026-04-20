import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";
import { encryptToken } from "@/lib/encryption";

export async function POST(req) {
    try {
        const body = await req.json();
        const { channelId, channelSecret, accessToken, channelName, workspaceId } = body;

        if (!channelId || !channelSecret || !accessToken || !workspaceId) {
            return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { user_id: true }
        });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        let myWorkspace = await prisma.workspaceMember.findFirst({
            where: { 
                user_id: dbUser.user_id,
                workspace_id: parseInt(workspaceId)
            },
            select: { workspace_id: true }
        });

        if (!myWorkspace) {
            return NextResponse.json({ 
                error: "คุณไม่มีสิทธิ์เชื่อมต่อ LINE ในพื้นที่ทำงาน (Workspace) นี้" 
            }, { status: 403 });
        }

        const validWorkspaceId = myWorkspace.workspace_id;

        const duplicateCheck = await prisma.channel.findFirst({
            where: {
                platform_name: "LINE",
                OR: [
                    { line_channel_id: channelId },
                    { line_channel_id: String(channelId) }
                ]
            }
        });

        if (duplicateCheck && String(duplicateCheck.workspace_id) !== String(validWorkspaceId)) {
            return NextResponse.json({ 
                error: "บล็อคการเชื่อมต่อ! LINE OA นี้ถูกทีมอื่นใช้งานอยู่แล้ว" 
            }, { status: 400 });
        }

        let lineBotName = channelName || "LINE OA";
        try {
            const lineInfoRes = await fetch("https://api.line.me/v2/bot/info", {
                headers: { Authorization: `Bearer ${accessToken.trim()}` }
            });
            if (lineInfoRes.ok) {
                const lineInfo = await lineInfoRes.json();
                lineBotName = lineInfo.displayName; 
            }
        } catch (err) {
            console.error("Verify LINE Error:", err);
        }

        let channel = await prisma.channel.findFirst({
            where: { platform_name: "LINE", line_channel_id: String(channelId), workspace_id: validWorkspaceId }
        });

        // 🚨 เข้ารหัส Token 2 ตัวนี้ก่อนเซฟ!
        const securedSecret = encryptToken(channelSecret.trim());
        const securedAccessToken = encryptToken(accessToken.trim());

        const channelData = {
            name: lineBotName,
            line_channel_secret: securedSecret,
            line_access_token: securedAccessToken,
            status: "CONNECTED",
            platform_name: "LINE",
            workspace_id: validWorkspaceId,
            line_channel_id: String(channelId) 
        };

        if (channel) {
            channel = await prisma.channel.update({
                where: { channel_id: channel.channel_id },
                data: channelData
            });
        } else {
            channel = await prisma.channel.create({
                data: channelData
            });
        }

        try {
            await pusherServer.trigger(`workspace-${validWorkspaceId}`, 'channel-updated', {
                message: `เชื่อมต่อ LINE OA สำเร็จแล้ว รีเฟรชหน้าต่างได้เลย!`
            });
        } catch (e) {
            console.log("Pusher Trigger Error:", e);
        }

        return NextResponse.json({ success: true, channel });

    } catch (error) {
        console.error("Line Connect Error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์" }, { status: 500 });
    }
}