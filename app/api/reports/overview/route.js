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

    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    // Last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Last 30 days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Previous 30 days (for trend)
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const wsFilter = { channel: { workspace_id: workspaceId } };

    // KPI 1: New customers (30 days)
    const newContacts30d = await prisma.customer.count({
      where: {
        created_at: { gte: thirtyDaysAgo, lte: todayEnd },
        chat_sessions: { some: wsFilter },
      },
    });
    const newContactsPrev30d = await prisma.customer.count({
      where: {
        created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        chat_sessions: { some: wsFilter },
      },
    });

    // KPI 2: Total conversations (30 days)
    const totalConvos30d = await prisma.chatSession.count({
      where: { ...wsFilter, start_time: { gte: thirtyDaysAgo, lte: todayEnd } },
    });
    const totalConvosPrev30d = await prisma.chatSession.count({
      where: { ...wsFilter, start_time: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });

    // KPI 3: Resolution rate (30 days)
    const resolvedConvos30d = await prisma.chatSession.count({
      where: {
        ...wsFilter,
        start_time: { gte: thirtyDaysAgo, lte: todayEnd },
        status: { in: ["CLOSED", "RESOLVED"] },
      },
    });
    const resolutionRate = totalConvos30d > 0 ? ((resolvedConvos30d / totalConvos30d) * 100) : 0;

    // KPI 4: Total messages (30 days)
    const totalMessages30d = await prisma.message.count({
      where: {
        created_at: { gte: thirtyDaysAgo, lte: todayEnd },
        chat_session: wsFilter,
      },
    });

    // 7-day trend chart data
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const [contacts, convos, messages] = await Promise.all([
        prisma.customer.count({
          where: {
            created_at: { gte: dayStart, lte: dayEnd },
            chat_sessions: { some: wsFilter },
          },
        }),
        prisma.chatSession.count({
          where: { ...wsFilter, start_time: { gte: dayStart, lte: dayEnd } },
        }),
        prisma.message.count({
          where: {
            created_at: { gte: dayStart, lte: dayEnd },
            chat_session: wsFilter,
          },
        }),
      ]);

      trendData.push({
        date: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        contacts,
        conversations: convos,
        messages,
      });
    }

    // Status distribution
    const statusCounts = await prisma.chatSession.groupBy({
      by: ["status"],
      where: { ...wsFilter, start_time: { gte: thirtyDaysAgo, lte: todayEnd } },
      _count: { status: true },
    });

    const statusDistribution = statusCounts.map((s) => ({
      name: s.status,
      value: s._count.status,
    }));

    // Trend calculator
    const calcTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return NextResponse.json({
      kpi: {
        newContacts: { value: newContacts30d, trend: calcTrend(newContacts30d, newContactsPrev30d).toFixed(1) },
        totalConversations: { value: totalConvos30d, trend: calcTrend(totalConvos30d, totalConvosPrev30d).toFixed(1) },
        resolutionRate: { value: resolutionRate.toFixed(1), trend: 0 },
        totalMessages: { value: totalMessages30d, trend: 0 },
      },
      trendData,
      statusDistribution,
    });
  } catch (error) {
    console.error("Error fetching report overview:", error);
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 });
  }
}
