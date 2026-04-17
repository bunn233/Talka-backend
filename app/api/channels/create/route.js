import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
    try {
        const body = await req.json();
        const { platformName, pageId, pageName, accessToken, workspaceId } = body;

        if (!platformName || !pageId || !accessToken || !workspaceId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { user_id: true }
        });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const myWorkspace = await prisma.workspaceMember.findFirst({
            where: { 
                user_id: dbUser.user_id,
                workspace_id: parseInt(workspaceId)
            },
            select: { workspace_id: true }
        });

        if (!myWorkspace) {
            return NextResponse.json({ 
                error: "คุณไม่มีสิทธิ์เชื่อมต่อช่องทางแชทในพื้นที่ทำงาน (Workspace) นี้" 
            }, { status: 403 });
        }

        const validWorkspaceId = myWorkspace.workspace_id;

        if (platformName === "FACEBOOK" || platformName === "INSTAGRAM") {
            const duplicateCheck = await prisma.channel.findFirst({
                where: {
                    platform_name: platformName,
                    OR: [
                        { fb_page_access_token: accessToken },
                        { fb_page_id: pageId },
                        { fb_page_id: String(pageId) }
                    ]
                }
            });

            if (duplicateCheck && String(duplicateCheck.workspace_id) !== String(validWorkspaceId)) {
                return NextResponse.json({ 
                    error: "บล็อคการเชื่อมต่อ! เพจหรือ Token นี้ถูกทีมอื่นใช้งานอยู่แล้ว" 
                }, { status: 400 });
            }
        }

        let existingChannel = await prisma.channel.findFirst({ 
            where: { fb_page_id: String(pageId), platform_name: platformName, workspace_id: validWorkspaceId } 
        });

        const channelData = {
            name: pageName || `${platformName} Channel`,
            status: "CONNECTED",
            platform_name: platformName,
            workspace_id: validWorkspaceId,
            fb_page_id: String(pageId), 
            fb_page_access_token: accessToken
        };

        let channel;
        if (existingChannel) {
            channel = await prisma.channel.update({
                where: { channel_id: existingChannel.channel_id },
                data: channelData
            });
        } else {
            channel = await prisma.channel.create({ data: channelData });
        }

        try {
            await pusherServer.trigger(`workspace-${validWorkspaceId}`, 'channel-updated', {
                message: `เชื่อมต่อ ${platformName} สำเร็จแล้ว รีเฟรชหน้าต่างได้เลย!`
            });
        } catch (e) {
            console.log("Pusher Trigger Error:", e);
        }

        return NextResponse.json({ success: true, channel });

    } catch (error) {
        console.error("❌ Create Channel Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}