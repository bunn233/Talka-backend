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
    const startDate = searchParams.get("start") ? new Date(searchParams.get("start")) : (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; })();
    const endDate = searchParams.get("end") ? new Date(searchParams.get("end")) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const botMessages = await prisma.message.findMany({
      where: {
        chat_session: { channel: { workspace_id: workspaceId } },
        created_at: { gte: startDate, lte: endDate },
        sender_type: "BOT"
      },
      select: { content: true, created_at: true }
    });

    // Estimate tokens: roughly 1 char = 0.25 tokens (standard GPT approximation)
    // Plus ~150 tokens base context per message
    const dayMap = {};
    let totalTokens = 0;

    // Initialize all days in range to 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split("T")[0];
      dayMap[dayKey] = 0;
    }

    botMessages.forEach((msg) => {
      const dayKey = new Date(msg.created_at).toISOString().split("T")[0];
      const charCount = msg.content?.length || 0;
      const estimatedTokens = Math.ceil(charCount * 0.25) + 150;
      
      if (dayMap[dayKey] !== undefined) {
        dayMap[dayKey] += estimatedTokens;
      }
      totalTokens += estimatedTokens;
    });

    const chartData = Object.keys(dayMap).sort().map(date => ({
      day: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tokens: dayMap[date] // Ensure raw number
    }));

    // Estimate Cost: Assume average mixed cost of $0.0015 per 1K tokens
    const estimatedCost = (totalTokens / 1000) * 0.0015;

    const breakdown = [
      { feature: "Support Agent", tokens: totalTokens, cost: estimatedCost },
      { feature: "Receptionist", tokens: 0, cost: 0 },
      { feature: "Sales Agent", tokens: 0, cost: 0 },
    ];

    return NextResponse.json({
      chartData,
      breakdown,
    });
  } catch (error) {
    console.error("Error fetching AI token report:", error);
    return NextResponse.json({ error: "Failed to fetch AI usage" }, { status: 500 });
  }
}
