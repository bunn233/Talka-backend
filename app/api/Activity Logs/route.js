import { getActivityLogs, getActivityLogCount } from "@/lib/dbLogger";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      level: searchParams.get("level") || undefined,
      action: searchParams.get("action") || undefined,
      type: searchParams.get("type") || undefined,
      user_id: searchParams.get("user_id")
        ? Number(searchParams.get("user_id"))
        : undefined,
      chat_session_id: searchParams.get("chat_session_id")
        ? Number(searchParams.get("chat_session_id"))
        : undefined,
      limit: Number(searchParams.get("limit")) || 20,
      offset: Number(searchParams.get("offset")) || 0,
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const [logs, total] = await Promise.all([
      getActivityLogs(filters),
      getActivityLogCount(filters),
    ]);

    return NextResponse.json({
      data: logs,
      total,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}