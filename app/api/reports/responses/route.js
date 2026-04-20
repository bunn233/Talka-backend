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

    // Get all chat sessions with their messages for the period
    const chatSessions = await prisma.chatSession.findMany({
      where: {
        ...wsFilter,
        start_time: { gte: startDate, lte: endDate },
      },
      include: {
        messages: {
          orderBy: { created_at: "asc" },
          select: { sender_type: true, created_at: true },
        },
      },
    });

    // Calculate First Response Time (FRT) for each session
    const frtData = [];

    chatSessions.forEach((cs) => {
      const msgs = cs.messages;
      if (msgs.length < 2) return;

      // Find first customer message
      const firstCustomerMsg = msgs.find((m) => m.sender_type === "CUSTOMER");
      if (!firstCustomerMsg) return;

      // Find first agent/bot response after first customer message
      const firstResponse = msgs.find(
        (m) =>
          (m.sender_type === "AGENT" || m.sender_type === "BOT") &&
          new Date(m.created_at) > new Date(firstCustomerMsg.created_at)
      );
      if (!firstResponse) return;

      const frtSec =
        (new Date(firstResponse.created_at).getTime() - new Date(firstCustomerMsg.created_at).getTime()) / 1000;

      const dayKey = new Date(cs.start_time).toISOString().split("T")[0];
      frtData.push({ dayKey, frtSec, responseCount: msgs.filter((m) => m.sender_type === "AGENT").length });
    });

    // Group by day
    const dayMap = {};
    frtData.forEach(({ dayKey, frtSec, responseCount }) => {
      if (!dayMap[dayKey]) dayMap[dayKey] = { totalFRT: 0, count: 0, totalResponses: 0 };
      dayMap[dayKey].totalFRT += frtSec;
      dayMap[dayKey].count++;
      dayMap[dayKey].totalResponses += responseCount;
    });

    const chartData = Object.keys(dayMap)
      .sort()
      .map((date) => {
        const d = dayMap[date];
        return {
          date,
          displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          avgTime: d.count > 0 ? Math.round(d.totalFRT / d.count) : 0,
          avgResponse: d.count > 0 ? Math.round(d.totalResponses / d.count) : 0,
          sessionCount: d.count,
        };
      });

    // Overall stats
    const totalFRT = frtData.reduce((s, d) => s + d.frtSec, 0);
    const avgFRT = frtData.length > 0 ? totalFRT / frtData.length : 0;
    const avgResponseCount =
      frtData.length > 0 ? frtData.reduce((s, d) => s + d.responseCount, 0) / frtData.length : 0;

    // Fastest / slowest
    const fastestDay = chartData.reduce((min, d) => (!min || d.avgTime < min.avgTime ? d : min), null);
    const slowestDay = chartData.reduce((max, d) => (!max || d.avgTime > max.avgTime ? d : max), null);

    // SLA compliance (target: 5 minutes = 300s)
    const SLA_TARGET = 300;
    const withinSLA = frtData.filter((d) => d.frtSec <= SLA_TARGET).length;
    const slaRate = frtData.length > 0 ? ((withinSLA / frtData.length) * 100).toFixed(0) : "0";

    // Time distribution buckets
    const buckets = [
      { label: "< 30s", range: [0, 30] },
      { label: "30s – 2m", range: [30, 120] },
      { label: "2m – 5m", range: [120, 300] },
      { label: "5m – 10m", range: [300, 600] },
      { label: "10m – 30m", range: [600, 1800] },
      { label: "30m – 1h", range: [1800, 3600] },
      { label: "> 1h", range: [3600, Infinity] },
    ].map((bucket) => {
      const count = frtData.filter((d) => d.frtSec >= bucket.range[0] && d.frtSec < bucket.range[1]).length;
      const pct = frtData.length > 0 ? ((count / frtData.length) * 100).toFixed(1) : "0";
      return { ...bucket, count, pct: `${pct}%` };
    });

    return NextResponse.json({
      chartData,
      timeBreakdown: buckets,
      stats: {
        avgFRT,
        avgResponseCount: avgResponseCount.toFixed(1),
        fastestDay: fastestDay ? { time: fastestDay.avgTime, date: fastestDay.displayDate } : null,
        slowestDay: slowestDay ? { time: slowestDay.avgTime, date: slowestDay.displayDate } : null,
        slaRate,
        slaTarget: SLA_TARGET,
        totalSessions: frtData.length,
      },
    });
  } catch (error) {
    console.error("Error fetching responses report:", error);
    return NextResponse.json({ error: "Failed to fetch responses report" }, { status: 500 });
  }
}
