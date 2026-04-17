import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function GET(req, context) {
    try {
        const params = await Promise.resolve(context.params);
        const { id } = params;

        if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

        const logs = await prisma.activityLog.findMany({
            where: { chat_session_id: parseInt(id) },
            orderBy: { created_at: 'desc' },
            include: {
                user: {
                    select: { username: true, profile_image: true }
                }
            }
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Fetch Logs Error:", error);
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}

// 🔥 บันทึกข้อมูล Log (POST) - ใส่ Pusher เพิ่ม
export async function POST(req, context) {
    try {
        const params = await Promise.resolve(context.params);
        const { id } = params; 

        const body = await req.json();
        let { user_id, action, old_value, new_value } = body; 

        let finalUserId = user_id;
        const checkUser = await prisma.user.findFirst();
        if (!finalUserId) {
            finalUserId = checkUser ? (checkUser.user_id || checkUser.id) : null;
        }

        const userConnectParams = checkUser?.user_id 
            ? { user_id: parseInt(finalUserId) } 
            : { id: parseInt(finalUserId) };

        const newLog = await prisma.activityLog.create({
            data: {
                chat: {
                    connect: { chat_session_id: parseInt(id) }
                },
                user: {
                    connect: userConnectParams
                },
                action: action,
                old_value: old_value ? String(old_value) : null,
                new_value: new_value ? String(new_value) : null
            },
            include: {
                chat: { select: { channel: { select: { workspace_id: true } } } }
            }
        });

        if (newLog.chat?.channel?.workspace_id) {
            try {
                await pusherServer.trigger(`workspace-${newLog.chat.channel.workspace_id}`, 'log-updated', {
                    chatId: id,
                    message: `เพิ่ม Log: ${action}`
                });
            } catch (e) {
                console.error("Pusher Error:", e);
            }
        }

        console.log(`✅ บันทึก Log: [${action}] สำเร็จ`);
        return NextResponse.json({ success: true, log: newLog });

    } catch (error) {
        console.error("❌ Save Log Error:", error);
        return NextResponse.json({ error: "Failed to save log" }, { status: 500 });
    }
}