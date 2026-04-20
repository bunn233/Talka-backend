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

    const wsFilter = { chat_sessions: { some: { channel: { workspace_id: workspaceId } } } };

    // Daily breakdown of new contacts
    const customers = await prisma.customer.findMany({
      where: {
        created_at: { gte: startDate, lte: endDate },
        ...wsFilter,
      },
      include: {
        social_accounts: {
          include: { channel: { select: { platform_name: true } } },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Group by day
    const dayMap = {};
    const channelCount = {};

    customers.forEach((c) => {
      const dayKey = new Date(c.created_at).toISOString().split("T")[0];
      if (!dayMap[dayKey]) dayMap[dayKey] = 0;
      dayMap[dayKey]++;

      // Channel distribution
      c.social_accounts.forEach((sa) => {
        const platform = sa.channel?.platform_name || "Unknown";
        if (!channelCount[platform]) channelCount[platform] = 0;
        channelCount[platform]++;
      });
    });

    // Build chart data sorted by date
    const chartData = Object.keys(dayMap)
      .sort()
      .map((date) => ({
        date,
        displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        newContacts: dayMap[date],
      }));

    // Channel distribution for pie chart
    const channelDistribution = Object.entries(channelCount).map(([name, value]) => ({
      name,
      value,
    }));

    // Recent contacts table
    const recentContacts = customers.slice(0, 50).map((c) => ({
      id: c.customer_id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      channel: c.social_accounts[0]?.channel?.platform_name || "Direct",
      createdAt: c.created_at,
      displayDate: new Date(c.created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      }),
    }));

    // Stats
    const totalNew = customers.length;
    let avgPerDay = "0.0";
    
    // Calculate total days in range
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    avgPerDay = (totalNew / diffDays).toFixed(1);

    const peakDay = chartData.reduce((max, d) => (d.newContacts > (max?.newContacts || 0) ? d : max), null);
    
    // Calculate top channel
    let topChannel = "-";
    if (channelDistribution.length > 0) {
      const best = channelDistribution.reduce((max, ch) => ch.value > max.value ? ch : max, channelDistribution[0]);
      topChannel = best.name;
    }

    return NextResponse.json({
      chartData,
      channelDistribution,
      recentContacts,
      stats: {
        totalNew,
        avgPerDay,
        topChannel,
        peakDay: peakDay ? { value: peakDay.newContacts, date: peakDay.displayDate } : null,
        channelsActive: channelDistribution.length,
      },
    });
  } catch (error) {
    console.error("Error fetching contacts report:", error);
    return NextResponse.json({ error: "Failed to fetch contacts report" }, { status: 500 });
  }
}
