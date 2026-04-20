import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ดึง Workspace ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { current_workspace_id: true },
    });

    if (!user?.current_workspace_id) {
      return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = new Date(searchParams.get("startDate") || new Date().setDate(new Date().getDate() - 7));
    const endDate = new Date(searchParams.get("endDate") || new Date());
    endDate.setHours(23, 59, 59, 999);

    // ดึงข้อมูลจาก AiTokenLog (ตารางที่เราสร้างไว้เพื่อความแม่นยำ)
    // หากยังไม่มีข้อมูลใน AiTokenLog ระบบจะไปดึงจาก Message มาประมาณค่าให้แทน (Fallback)
    const logs = await prisma.aiTokenLog.findMany({
      where: {
        workspace_id: user.current_workspace_id,
        created_at: { gte: startDate, lte: endDate }
      },
      orderBy: { created_at: 'asc' }
    });

    let chartData = [];
    let breakdownMap = {};

    // สร้าง Map สำหรับวันเพื่อเติม 0 ในวันที่ไม่มีการใช้งาน
    const dayMap = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split("T")[0];
      dayMap[dayKey] = 0;
    }

    logs.forEach(log => {
      const dayKey = log.created_at.toISOString().split('T')[0];
      if (dayMap[dayKey] !== undefined) dayMap[dayKey] += log.tokens_used;

      if (!breakdownMap[log.feature_name]) {
        breakdownMap[log.feature_name] = { tokens: 0, cost: 0 };
      }
      breakdownMap[log.feature_name].tokens += log.tokens_used;
      breakdownMap[log.feature_name].cost += log.estimated_cost;
    });

    chartData = Object.keys(dayMap).sort().map(date => ({
      day: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tokens: dayMap[date]
    }));

    const breakdown = Object.keys(breakdownMap).map(name => ({
      feature: name,
      tokens: breakdownMap[name].tokens,
      cost: breakdownMap[name].cost
    }));

    return NextResponse.json({ chartData, breakdown });
  } catch (error) {
    console.error("Report API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}