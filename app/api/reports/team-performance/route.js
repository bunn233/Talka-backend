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

    // Get workspace members
    const members = await prisma.workspaceMember.findMany({
      where: { workspace_id: workspaceId },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            role: true,
            profile_image: true,
            online_status: true,
          },
        },
      },
    });

    // Get performance data for each team member
    const teamData = await Promise.all(
      members.map(async (member) => {
        const uid = member.user.user_id;

        // Assigned conversations
        const assigned = await prisma.chatSession.count({
          where: {
            ...wsFilter,
            assigned_user_id: uid,
            start_time: { gte: startDate, lte: endDate },
          },
        });

        // Closed/resolved conversations
        const closed = await prisma.chatSession.count({
          where: {
            ...wsFilter,
            assigned_user_id: uid,
            start_time: { gte: startDate, lte: endDate },
            status: { in: ["CLOSED", "RESOLVED"] },
          },
        });

        // Messages sent
        const messagesSent = await prisma.message.count({
          where: {
            sender_type: "AGENT",
            sender_id: uid,
            created_at: { gte: startDate, lte: endDate },
            chat_session: wsFilter,
          },
        });

        // Average response time (FRT per agent)
        const agentSessions = await prisma.chatSession.findMany({
          where: {
            ...wsFilter,
            assigned_user_id: uid,
            start_time: { gte: startDate, lte: endDate },
          },
          include: {
            messages: {
              orderBy: { created_at: "asc" },
              select: { sender_type: true, created_at: true, sender_id: true },
            },
          },
        });

        let totalFRT = 0;
        let frtCount = 0;
        agentSessions.forEach((cs) => {
          const firstCustomer = cs.messages.find((m) => m.sender_type === "CUSTOMER");
          if (!firstCustomer) return;
          const firstResponse = cs.messages.find(
            (m) =>
              m.sender_type === "AGENT" &&
              m.sender_id === uid &&
              new Date(m.created_at) > new Date(firstCustomer.created_at)
          );
          if (!firstResponse) return;
          totalFRT += (new Date(firstResponse.created_at).getTime() - new Date(firstCustomer.created_at).getTime()) / 1000;
          frtCount++;
        });

        const avgFRT = frtCount > 0 ? totalFRT / frtCount : 0;

        return {
          userId: uid,
          name: member.user.username,
          role: member.role,
          profileImage: member.user.profile_image,
          onlineStatus: member.user.online_status,
          assigned,
          closed,
          messages: messagesSent,
          avgResponseTime: avgFRT,
          resolutionRate: assigned > 0 ? ((closed / assigned) * 100).toFixed(0) : "0",
        };
      })
    );

    // Sort by closed conversations (best performer first)
    teamData.sort((a, b) => b.closed - a.closed);

    // Activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        created_at: { gte: startDate, lte: endDate },
        user: {
          workspaces: { some: { workspace_id: workspaceId } },
        },
      },
      include: {
        user: { select: { username: true } },
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    const formattedLogs = activityLogs.map((log) => ({
      id: log.log_id,
      timestamp: new Date(log.created_at).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      }),
      user: log.user?.username || "System",
      action: log.action,
      oldValue: log.old_value,
      newValue: log.new_value,
      chatSessionId: log.chat_session_id,
    }));

    // Team KPIs
    const totalAssigned = teamData.reduce((s, d) => s + d.assigned, 0);
    const totalClosed = teamData.reduce((s, d) => s + d.closed, 0);
    const totalMessages = teamData.reduce((s, d) => s + d.messages, 0);
    const overallResRate = totalAssigned > 0 ? ((totalClosed / totalAssigned) * 100).toFixed(0) : "0";

    return NextResponse.json({
      teamData,
      activityLogs: formattedLogs,
      stats: {
        totalAssigned,
        totalClosed,
        totalMessages,
        resolutionRate: overallResRate,
        teamSize: teamData.length,
      },
    });
  } catch (error) {
    console.error("Error fetching team performance:", error);
    return NextResponse.json({ error: "Failed to fetch team performance" }, { status: 500 });
  }
}
