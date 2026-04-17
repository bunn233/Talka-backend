import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
    try {
        const { botToken, channelName, workspaceId } = await req.json();

        if (!botToken || !workspaceId) {
            return NextResponse.json({ error: "กรุณาระบุข้อมูลให้ครบถ้วน (Bot Token และ Workspace ID)" }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
                error: "คุณไม่มีสิทธิ์เชื่อมต่อ Telegram ในพื้นที่ทำงาน (Workspace) นี้" 
            }, { status: 403 });
        }

        const validWorkspaceId = myWorkspace.workspace_id;

        const duplicateCheck = await prisma.channel.findFirst({
            where: {
                platform_name: "TELEGRAM",
                telegram_bot_token: botToken
            }
        });

        if (duplicateCheck && String(duplicateCheck.workspace_id) !== String(validWorkspaceId)) {
            return NextResponse.json({ 
                error: "บล็อคการเชื่อมต่อ! บอท Telegram (Token) นี้ถูกทีมอื่นใช้งานอยู่แล้ว" 
            }, { status: 400 });
        }

        const DOMAIN = process.env.NEXT_PUBLIC_BASE_URL; 
        if (!DOMAIN) return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า NEXT_PUBLIC_BASE_URL ใน .env" }, { status: 500 });
        const webhookUrl = `${DOMAIN}/api/webhook/telegram`;

        const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
        const tgResult = await tgResponse.json();

        if (!tgResult.ok) {
            return NextResponse.json({ error: `เชื่อมต่อ Telegram ไม่สำเร็จ: ${tgResult.description}` }, { status: 400 });
        }

        const meResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const meResult = await meResponse.json();
        
        let actualBotName = "Telegram Bot"; 
        if (meResult.ok && meResult.result) {
            if (meResult.result.username) actualBotName = `@${meResult.result.username}`;
            else if (meResult.result.first_name) actualBotName = meResult.result.first_name;
            else if (channelName) actualBotName = channelName;
        } else {
            actualBotName = channelName || "Telegram Bot";
        }

        const existingChannel = await prisma.channel.findFirst({
            where: { telegram_bot_token: botToken, workspace_id: validWorkspaceId }
        });

        let savedChannel;

        if (existingChannel) {
             savedChannel = await prisma.channel.update({
                 where: { channel_id: existingChannel.channel_id },
                 data: { name: actualBotName, status: "CONNECTED" }
             });
        } else {
             savedChannel = await prisma.channel.create({
                 data: {
                     name: actualBotName,
                     platform_name: "TELEGRAM",
                     telegram_bot_token: botToken,
                     status: "CONNECTED",
                     workspace_id: validWorkspaceId 
                 }
             });
        }

        try {
            await pusherServer.trigger(`workspace-${validWorkspaceId}`, 'channel-updated', {
                message: `เชื่อมต่อบอท Telegram สำเร็จแล้ว รีเฟรชหน้าต่างได้เลย!`
            });
        } catch (e) {
            console.log("Pusher Trigger Error:", e);
        }

        return NextResponse.json({ success: true, message: `เชื่อมต่อบอท "${actualBotName}" สำเร็จ!`, channel: savedChannel }, { status: 200 });

    } catch (error) {
        console.error("Setup Telegram Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}