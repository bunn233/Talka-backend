import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

// 🟢 1. ฟังก์ชันดึงประวัติ (GET) 
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get("chatId");

        if (!chatId) {
            return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
        }

        // ดึงประวัติของแชทนี้ทั้งหมด เรียงจากใหม่ไปเก่า
        const logs = await prisma.activityLog.findMany({
            where: { chat_session_id: parseInt(chatId) },
            orderBy: { created_at: "desc" },
            include: {
                user: {
                    select: {
                        username: true,
                        profile_image: true,
                    }
                }
            }
        });

        return NextResponse.json({ logs: logs }, { status: 200 });

    } catch (error) {
        console.error("❌ Fetch Log Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 🟢 2. ฟังก์ชันบันทึกประวัติ (POST)
export async function POST(req) {
    try {
        const body = await req.json();
        let { chat_session_id, user_id, action, old_value, new_value, detail } = body;

        // 1. ตรวจสอบข้อมูลบังคับว่าส่งมาครบไหม
        if (!chat_session_id || !action) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน (ต้องการ chat_session_id และ action)" }, { status: 400 });
        }

        if (!user_id) {
            const firstUser = await prisma.user.findFirst();
            if (!firstUser) {
                return NextResponse.json({ error: "ไม่พบข้อมูล User ในระบบเลย กรุณาสร้าง User ก่อน" }, { status: 400 });
            }
            user_id = firstUser.user_id || firstUser.id; 
        } else {
            // เช็คว่า user_id ที่ส่งมา มีตัวตนอยู่จริงไหม
            const existingUser = await prisma.user.findFirst({
                where: { OR: [{ user_id: parseInt(user_id) }, { id: parseInt(user_id) }] }
            });
            if (!existingUser) {
                // ถ้าไม่มีตัวตน ให้เอาคนแรกในระบบมาใช้แทน
                const firstUser = await prisma.user.findFirst();
                user_id = firstUser ? (firstUser.user_id || firstUser.id) : null;
            }
        }

        // 3. บันทึกลง Database
        const newLog = await prisma.activityLog.create({
            data: {
                chat_session_id: parseInt(chat_session_id),
                user_id: parseInt(user_id),
                action: action,
                old_value: old_value ? String(old_value) : null,
                new_value: new_value ? String(new_value) : null,
                detail: detail ? String(detail) : null
            },
            // ดึง workspace_id ออกมาด้วย เพื่อให้ Pusher รู้ว่าจะต้องไปตะโกนบอกทีมไหน
            include: {
                chat: { select: { channel: { select: { workspace_id: true } } } }
            }
        });

        // 3. ตะโกนบอก Pusher
        if (newLog.chat?.channel?.workspace_id) {
            try {
                await pusherServer.trigger(`workspace-${newLog.chat.channel.workspace_id}`, 'log-updated', {
                    chatId: chat_session_id,
                    message: `อัปเดตประวัติการทำงาน: ${action}`
                });
            } catch (e) {
                console.error("Pusher Error:", e);
            }
        }

        console.log(`✅ บันทึก Log สำเร็จ: [${action}] ลงแชท ${chat_session_id}`);
        return NextResponse.json({ success: true, log: newLog });

    } catch (error) {
        console.error("❌ Save Log Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}