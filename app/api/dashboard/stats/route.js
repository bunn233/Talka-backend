import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : null;

    let workspaceId = null;
    if (userId) {
        const user = await prisma.user.findUnique({
            where: { user_id: userId },
            select: { current_workspace_id: true }
        });
        workspaceId = user?.current_workspace_id;
    }

    if (!workspaceId) {
        return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
    }

    // Helpers for dates
    const getToday = () => {
      const d = new Date();
      d.setHours(0,0,0,0);
      return d;
    };
    const getEndOfDay = (d) => {
      const end = new Date(d);
      end.setHours(23,59,59,999);
      return end;
    };

    const todayStart = getToday();
    const todayEnd = getEndOfDay(todayStart);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = getEndOfDay(yesterdayStart);

    const thisWeekStart = new Date(todayStart);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay()); // Sunday start
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
    thisWeekEnd.setHours(23,59,59,999);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekEnd);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    // Trend calculator
    const calcTrend = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // 1. New Customers (TODAY)
    const newCustomersToday = await prisma.customer.count({
        where: {
            created_at: { gte: todayStart, lte: todayEnd },
            chat_sessions: { some: { channel: { workspace_id: workspaceId } } }
        }
    });
    const newCustomersYesterday = await prisma.customer.count({
        where: {
            created_at: { gte: yesterdayStart, lte: yesterdayEnd },
            chat_sessions: { some: { channel: { workspace_id: workspaceId } } }
        }
    });
    const newCustomersTrend = calcTrend(newCustomersToday, newCustomersYesterday);

    // 2. Unreplied (LIVE)
    const unrepliedCount = await prisma.chatSession.count({
      where: { 
        channel: { workspace_id: workspaceId },
        status: { in: ["NEW", "OPEN", "PENDING"] } 
      }
    });
    // We cannot easily query the snapshot of unreplied from an hour ago without historical logs, 
    // so we will pass 0 for trend or omit it. We'll pass 0 for now.
    const unrepliedTrend = 0; 

    // 3. Incoming Message (TODAY)
    const incomingMessagesToday = await prisma.message.count({
      where: { 
        sender_type: "CUSTOMER",
        created_at: { gte: todayStart, lte: todayEnd },
        chat_session: { channel: { workspace_id: workspaceId } }
      }
    });
    const incomingMessagesYesterday = await prisma.message.count({
        where: { 
          sender_type: "CUSTOMER",
          created_at: { gte: yesterdayStart, lte: yesterdayEnd },
          chat_session: { channel: { workspace_id: workspaceId } }
        }
    });
    const incomingTrend = calcTrend(incomingMessagesToday, incomingMessagesYesterday);

    // 4. Resolution Rate (THIS WEEK)
    const chatsThisWeekTotal = await prisma.chatSession.count({
        where: {
            channel: { workspace_id: workspaceId },
            start_time: { gte: thisWeekStart, lte: thisWeekEnd }
        }
    });
    const chatsThisWeekResolved = await prisma.chatSession.count({
        where: {
            channel: { workspace_id: workspaceId },
            start_time: { gte: thisWeekStart, lte: thisWeekEnd },
            status: { in: ["CLOSED", "RESOLVED"] }
        }
    });
    const resPercentThisWeek = chatsThisWeekTotal > 0 ? (chatsThisWeekResolved / chatsThisWeekTotal) * 100 : 0;

    const chatsLastWeekTotal = await prisma.chatSession.count({
        where: {
            channel: { workspace_id: workspaceId },
            start_time: { gte: lastWeekStart, lte: lastWeekEnd }
        }
    });
    const chatsLastWeekResolved = await prisma.chatSession.count({
        where: {
            channel: { workspace_id: workspaceId },
            start_time: { gte: lastWeekStart, lte: lastWeekEnd },
            status: { in: ["CLOSED", "RESOLVED"] }
        }
    });
    const resPercentLastWeek = chatsLastWeekTotal > 0 ? (chatsLastWeekResolved / chatsLastWeekTotal) * 100 : 0;
    const resPercentTrend = calcTrend(resPercentThisWeek, resPercentLastWeek);

    // แพ็กข้อมูลทั้งหมดส่งกลับไปให้หน้า Frontend
    return NextResponse.json({
      newCustomers: newCustomersToday,
      newCustomersTrend: newCustomersTrend.toFixed(1),
      unreplied: unrepliedCount,
      unrepliedTrend: unrepliedTrend,
      incomingMessages: incomingMessagesToday,
      incomingTrend: incomingTrend.toFixed(1),
      closedChatPercent: resPercentThisWeek.toFixed(2),
      closedChatTrend: resPercentTrend.toFixed(1)
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" }, 
      { status: 500 }
    );
  }
}