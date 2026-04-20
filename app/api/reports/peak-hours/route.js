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
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const wsFilter = { channel: { workspace_id: workspaceId } };

    // Get all messages from last 30 days to build heatmap
    const messages = await prisma.message.findMany({
      where: {
        created_at: { gte: thirtyDaysAgo },
        chat_session: wsFilter,
      },
      select: { created_at: true },
    });

    // Build heatmap: 7 days × 24 hours
    const heatmap = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Initialize
    for (let d = 0; d < 7; d++) {
      heatmap[d] = {};
      for (let h = 0; h < 24; h++) {
        heatmap[d][h] = 0;
      }
    }

    // Fill data
    messages.forEach((msg) => {
      const date = new Date(msg.created_at);
      const day = date.getDay(); // 0=Sun, 6=Sat
      const hour = date.getHours();
      heatmap[day][hour]++;
    });

    // Convert to array format for frontend
    const heatmapData = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        heatmapData.push({
          day: d,
          dayName: dayNames[d],
          hour: h,
          value: heatmap[d][h],
        });
      }
    }

    // Find peak hours
    const sorted = [...heatmapData].sort((a, b) => b.value - a.value);
    const peakHour = sorted[0] || { dayName: "-", hour: 0, value: 0 };
    const quietHour = sorted[sorted.length - 1] || { dayName: "-", hour: 0, value: 0 };

    return NextResponse.json({
      heatmapData,
      peakHour: { day: peakHour.dayName, hour: `${peakHour.hour}:00`, count: peakHour.value },
      quietHour: { day: quietHour.dayName, hour: `${quietHour.hour}:00`, count: quietHour.value },
      totalMessages: messages.length,
    });
  } catch (error) {
    console.error("Error fetching peak hours:", error);
    return NextResponse.json({ error: "Failed to fetch peak hours" }, { status: 500 });
  }
}
