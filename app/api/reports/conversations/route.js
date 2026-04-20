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

    const wsFilter = { channel: { workspace_id: workspaceId } };

    // All conversations in range
    const conversations = await prisma.chatSession.findMany({
      where: {
        ...wsFilter,
        start_time: { gte: startDate, lte: endDate },
      },
      include: {
        customer: { select: { name: true, customer_id: true } },
        channel: { select: { platform_name: true } },
        assigned_user: { select: { username: true } },
      },
      orderBy: { start_time: "desc" },
    });

    // Daily breakdown
    const dayMap = {};
    const statusTotal = { NEW: 0, OPEN: 0, PENDING: 0, CLOSED: 0, RESOLVED: 0 };

    conversations.forEach((c) => {
      const dayKey = new Date(c.start_time).toISOString().split("T")[0];
      if (!dayMap[dayKey]) {
        dayMap[dayKey] = { opened: 0, closed: 0, pending: 0, resolved: 0 };
      }

      if (c.status === "CLOSED") { dayMap[dayKey].closed++; }
      else if (c.status === "RESOLVED") { dayMap[dayKey].resolved++; }
      else if (c.status === "PENDING") { dayMap[dayKey].pending++; }
      else { dayMap[dayKey].opened++; }

      if (statusTotal[c.status] !== undefined) statusTotal[c.status]++;
    });

    const chartData = Object.keys(dayMap)
      .sort()
      .map((date) => ({
        date,
        displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ...dayMap[date],
        total: dayMap[date].opened + dayMap[date].closed + dayMap[date].pending + dayMap[date].resolved,
      }));

    // Status distribution (pie chart)
    const statusDistribution = Object.entries(statusTotal)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    // Average duration (for resolved/closed conversations)
    const closedConvos = conversations.filter((c) => c.status === "CLOSED" || c.status === "RESOLVED");
    let avgDurationSec = 0;
    if (closedConvos.length > 0) {
      const totalDuration = closedConvos.reduce((sum, c) => {
        const start = new Date(c.start_time).getTime();
        const end = c.end_time ? new Date(c.end_time).getTime() : new Date(c.start_time).getTime();
        return sum + (end - start) / 1000;
      }, 0);
      avgDurationSec = totalDuration / closedConvos.length;
    }

    // Table data
    const tableData = conversations.slice(0, 100).map((c) => ({
      id: c.chat_session_id,
      customer: c.customer?.name || "Unknown",
      channel: c.channel?.platform_name || "Unknown",
      agent: c.assigned_user?.username || "Unassigned",
      status: c.status,
      startTime: c.start_time,
      endTime: c.end_time,
      displayDate: new Date(c.start_time).toLocaleDateString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      }),
    }));

    const totalOpened = statusTotal.NEW + statusTotal.OPEN;
    const totalClosed = statusTotal.CLOSED + statusTotal.RESOLVED;
    const resolutionRate = conversations.length > 0 ? ((totalClosed / conversations.length) * 100).toFixed(1) : "0";

    return NextResponse.json({
      chartData,
      statusDistribution,
      tableData,
      stats: {
        total: conversations.length,
        opened: totalOpened,
        closed: totalClosed,
        pending: statusTotal.PENDING,
        resolutionRate,
        avgDurationSec,
      },
    });
  } catch (error) {
    console.error("Error fetching conversations report:", error);
    return NextResponse.json({ error: "Failed to fetch conversations report" }, { status: 500 });
  }
}
