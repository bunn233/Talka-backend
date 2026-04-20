import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const memberId = url.searchParams.get("userId");
    if (!memberId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get requester's current workspace
    const requester = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { current_workspace_id: true },
    });

    if (!requester?.current_workspace_id) {
      return NextResponse.json({ error: "No active workspace" }, { status: 403 });
    }

    const wsId = requester.current_workspace_id;

    // Verify target member belongs to same workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspace_id: wsId,
        user_id: parseInt(memberId),
      },
      include: {
        user: true,
        workspace: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Member not found in this workspace" }, { status: 404 });
    }

    const u = membership.user;

    // --- Stats ---
    // หาแชทที่สมาชิกมีส่วนเกี่ยวข้อง: ถูก assign ให้ หรือ เคยส่งข้อความในห้องนั้น (เป็น AGENT)
    const chatsWithMessages = await prisma.chatSession.findMany({
      where: {
        channel: { workspace_id: wsId },
        OR: [
          { assigned_user_id: u.user_id },
          { messages: { some: { sender_type: "AGENT", sender_id: u.user_id } } }
        ]
      },
      select: { chat_session_id: true, status: true }
    });

    const totalHandled = chatsWithMessages.length;
    const resolvedCount = chatsWithMessages.filter(c => ["RESOLVED", "CLOSED"].includes(c.status)).length;
    const openCount = chatsWithMessages.filter(c => ["OPEN", "PENDING", "NEW"].includes(c.status)).length;

    // Recent 5 chat sessions ที่สมาชิกมีส่วนร่วม
    const recentSessions = await prisma.chatSession.findMany({
      where: {
        channel: { workspace_id: wsId },
        OR: [
          { assigned_user_id: u.user_id },
          { messages: { some: { sender_type: "AGENT", sender_id: u.user_id } } }
        ]
      },
      include: {
        customer: { select: { name: true, image: true } },
        channel: { select: { name: true, platform_name: true } },
      },
      orderBy: { start_time: "desc" },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      member: {
        id: u.user_id,
        name: u.username,
        email: u.email,
        phone: u.phone || null,
        company: u.company || null,
        country: u.country || null,
        role: membership.role,
        isOnline: u.online_status === "ONLINE",
        onlineStatus: u.online_status,
        avatar: u.profile_image || null,
        joinedAt: membership.joined_at,
        workspaceName: membership.workspace.name,
        stats: {
          totalAssigned: totalHandled,
          resolved: resolvedCount,
          open: openCount,
          resolutionRate: totalHandled > 0 ? Math.round((resolvedCount / totalHandled) * 100) : 0,
        },
        recentSessions: recentSessions.map((s) => ({
          id: s.chat_session_id,
          customerName: s.customer?.name || "Unknown",
          customerImage: s.customer?.image || null,
          channelName: s.channel?.name || "Unknown",
          platform: s.channel?.platform_name || "unknown",
          status: s.status,
          startTime: s.start_time,
        })),
      },
    });
  } catch (error) {
    console.error("Member Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
