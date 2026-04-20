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

    // Get all channels in this workspace
    const channels = await prisma.channel.findMany({
      where: { workspace_id: workspaceId },
      select: {
        channel_id: true,
        name: true,
        platform_name: true,
        status: true,
      },
    });

    // Get stats per channel
    const channelData = await Promise.all(
      channels.map(async (ch) => {
        const conversations = await prisma.chatSession.count({
          where: {
            channel_id: ch.channel_id,
            start_time: { gte: startDate, lte: endDate },
          },
        });

        const resolved = await prisma.chatSession.count({
          where: {
            channel_id: ch.channel_id,
            start_time: { gte: startDate, lte: endDate },
            status: { in: ["CLOSED", "RESOLVED"] },
          },
        });

        const messages = await prisma.message.count({
          where: {
            chat_session: { channel_id: ch.channel_id },
            created_at: { gte: startDate, lte: endDate },
          },
        });

        const customers = await prisma.customerSocialAccount.count({
          where: { channel_id: ch.channel_id },
        });

        // FRT per channel
        const sessions = await prisma.chatSession.findMany({
          where: {
            channel_id: ch.channel_id,
            start_time: { gte: startDate, lte: endDate },
          },
          include: {
            messages: {
              orderBy: { created_at: "asc" },
              select: { sender_type: true, created_at: true },
              take: 10,
            },
          },
        });

        let totalFRT = 0;
        let frtCount = 0;
        sessions.forEach((cs) => {
          const firstCustomer = cs.messages.find((m) => m.sender_type === "CUSTOMER");
          if (!firstCustomer) return;
          const firstAgent = cs.messages.find(
            (m) => m.sender_type === "AGENT" && new Date(m.created_at) > new Date(firstCustomer.created_at)
          );
          if (!firstAgent) return;
          totalFRT += (new Date(firstAgent.created_at).getTime() - new Date(firstCustomer.created_at).getTime()) / 1000;
          frtCount++;
        });

        return {
          id: ch.channel_id,
          name: ch.name,
          platform: ch.platform_name,
          status: ch.status,
          conversations,
          resolved,
          resolutionRate: conversations > 0 ? ((resolved / conversations) * 100).toFixed(1) : "0",
          messages,
          customers,
          avgResponseTime: frtCount > 0 ? Math.round(totalFRT / frtCount) : 0,
        };
      })
    );

    // Daily trend per platform
    const platformSessions = await prisma.chatSession.findMany({
      where: {
        channel: { workspace_id: workspaceId },
        start_time: { gte: startDate, lte: endDate },
      },
      include: {
        channel: { select: { platform_name: true } },
      },
    });

    const dayPlatformMap = {};
    platformSessions.forEach((cs) => {
      const dayKey = new Date(cs.start_time).toISOString().split("T")[0];
      const platform = cs.channel?.platform_name || "Unknown";
      if (!dayPlatformMap[dayKey]) dayPlatformMap[dayKey] = {};
      if (!dayPlatformMap[dayKey][platform]) dayPlatformMap[dayKey][platform] = 0;
      dayPlatformMap[dayKey][platform]++;
    });

    // Get all unique platforms
    const allPlatforms = [...new Set(channelData.map((c) => c.platform))];

    const trendData = Object.keys(dayPlatformMap)
      .sort()
      .map((date) => {
        const row = {
          date,
          displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        };
        allPlatforms.forEach((p) => {
          row[p] = dayPlatformMap[date][p] || 0;
        });
        return row;
      });

    // Platform distribution for pie chart
    const platformDistribution = channelData.reduce((acc, ch) => {
      const existing = acc.find((a) => a.name === ch.platform);
      if (existing) {
        existing.value += ch.conversations;
      } else {
        acc.push({ name: ch.platform, value: ch.conversations });
      }
      return acc;
    }, []);

    return NextResponse.json({
      channelData,
      trendData,
      platforms: allPlatforms,
      platformDistribution,
      stats: {
        totalChannels: channels.length,
        totalConversations: channelData.reduce((s, d) => s + d.conversations, 0),
        totalMessages: channelData.reduce((s, d) => s + d.messages, 0),
        totalCustomers: channelData.reduce((s, d) => s + d.customers, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching channels report:", error);
    return NextResponse.json({ error: "Failed to fetch channels report" }, { status: 500 });
  }
}
