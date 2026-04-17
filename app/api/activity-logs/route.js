import { NextResponse } from "next/server";
import { dbLog, getActivityLogs, getActivityLogCount } from "@/lib/dbLogger";
import { pusherServer } from "@/lib/pusher";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 🟢 GET: สำหรับดึงข้อมูล Log ไปแสดงที่ ActivityLogPanel และหน้า Admin
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      level: searchParams.get("level") || undefined,
      action: searchParams.get("action") || undefined,
      type: searchParams.get("type") || undefined,
      user_id: searchParams.get("user_id") ? Number(searchParams.get("user_id")) : undefined,
      chat_session_id: searchParams.get("chatId") ? Number(searchParams.get("chatId")) : undefined,
      limit: Number(searchParams.get("limit")) || 50,
      offset: Number(searchParams.get("offset")) || 0,
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    // ใช้ dbLogger ของคุณดึงข้อมูล
    const logs = await getActivityLogs(filters);
    const total = await getActivityLogCount(filters);

    return NextResponse.json({ logs, total }, { status: 200 });
  } catch (error) {
    console.error("❌ Fetch Log Error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

// 🟢 POST: สำหรับบันทึก Log ใหม่ (จากโค้ดเดิมของคุณ)
export async function POST(req) {
    try {
        const body = await req.json();
        const newLog = await dbLog(body);

        if (newLog && body.chat_session_id) {
            const chat = await prisma.chatSession.findUnique({
                where: { chat_session_id: parseInt(body.chat_session_id) },
                include: { channel: true }
            });
            if (chat?.channel?.workspace_id) {
                await pusherServer.trigger(`workspace-${chat.channel.workspace_id}`, 'log-updated', {
                    chatId: body.chat_session_id,
                    action: body.action
                });
            }
        }
        return NextResponse.json({ success: true, log: newLog });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}