import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : null;

    let workspaceId = null;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: { current_workspace_id: true },
      });
      workspaceId = user?.current_workspace_id;
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start") ? new Date(searchParams.get("start")) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
    const endDate = searchParams.get("end") ? new Date(searchParams.get("end")) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const wsFilter = { chat_session: { channel: { workspace_id: workspaceId } } };

    // Count by sender type
    const [incoming, outgoing, botMessages] = await Promise.all([
      prisma.message.count({
        where: { ...wsFilter, sender_type: "CUSTOMER", created_at: { gte: startDate, lte: endDate } },
      }),
      prisma.message.count({
        where: { ...wsFilter, sender_type: "AGENT", created_at: { gte: startDate, lte: endDate } },
      }),
      prisma.message.count({
        where: { ...wsFilter, sender_type: "BOT", created_at: { gte: startDate, lte: endDate } },
      }),
    ]);

    // Daily breakdown
    const messages = await prisma.message.findMany({
      where: {
        ...wsFilter,
        created_at: { gte: startDate, lte: endDate },
      },
      select: {
        sender_type: true,
        message_type: true,
        is_read: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    const dayMap = {};
    messages.forEach((m) => {
      const dayKey = new Date(m.created_at).toISOString().split("T")[0];
      if (!dayMap[dayKey]) {
        dayMap[dayKey] = { incoming: 0, outgoing: 0, bot: 0, text: 0, image: 0, file: 0, read: 0, unread: 0 };
      }
      if (m.sender_type === "CUSTOMER") dayMap[dayKey].incoming++;
      else if (m.sender_type === "AGENT") dayMap[dayKey].outgoing++;
      else if (m.sender_type === "BOT") dayMap[dayKey].bot++;

      if (m.message_type === "TEXT") dayMap[dayKey].text++;
      else if (m.message_type === "IMAGE") dayMap[dayKey].image++;
      else dayMap[dayKey].file++;

      if (m.is_read) dayMap[dayKey].read++;
      else dayMap[dayKey].unread++;
    });

    const chartData = Object.keys(dayMap)
      .sort()
      .map((date) => ({
        date,
        displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ...dayMap[date],
      }));

    // Type distribution
    const typeDistribution = [
      { name: "Text", value: messages.filter((m) => m.message_type === "TEXT").length },
      { name: "Image", value: messages.filter((m) => m.message_type === "IMAGE").length },
      { name: "File", value: messages.filter((m) => m.message_type === "FILE").length },
      { name: "Video", value: messages.filter((m) => m.message_type === "VIDEO").length },
      { name: "Audio", value: messages.filter((m) => m.message_type === "AUDIO").length },
    ].filter((t) => t.value > 0);

    const total = incoming + outgoing + botMessages;
    const readCount = messages.filter((m) => m.is_read).length;

    return NextResponse.json({
      chartData,
      typeDistribution,
      stats: {
        total,
        incoming,
        outgoing,
        bot: botMessages,
        read: readCount,
        unread: total - readCount,
      },
    });
  } catch (error) {
    console.error("Error fetching messages report:", error);
    return NextResponse.json({ error: "Failed to fetch messages report" }, { status: 500 });
  }
}
