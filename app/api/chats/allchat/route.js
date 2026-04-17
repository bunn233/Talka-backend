import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const chats = await prisma.chatSession.findMany({
      where: {
        channel: {
          is_active: true,
        },
      },
      include: {
        customer: true,
        platform: true,
        messages: { orderBy: { created_at: "asc" } },
        _count: {
          select: {
            messages: {
              where: {
                sender_type: "CUSTOMER",
                is_read: false,
              },
            },
          },
        },
      },
      orderBy: { start_time: "desc" },
    });

    //  ดึงชื่อ Admin ทั้งหมดมาเตรียมไว้จับคู่
    const users = await prisma.user.findMany({ select: { user_id: true, username: true } });
    const userMap = {};
    users.forEach(u => userMap[u.user_id] = u.username);

    const formatted = chats.map((chat) => ({
      id: chat.chat_session_id,
      name: chat.customer?.name || "Unknown",
      imgUrl: chat.customer?.image,
      status: chat.status,
      platform: chat.platform?.platform_name || "UNKNOWN",
      workspaceId: chat.channel?.workspace_id || chat.platform?.workspace_id,
      lastMessage: chat.messages[chat.messages.length - 1]?.content || "No messages",
      unreadCount: chat._count.messages,

      messages: chat.messages.map((m) => ({
        id: m.message_id,
        external_id: m.external_id,
        //  บังคับให้แอดมินอยู่ฝั่งขวาเสมอ
        from: m.sender_type === "AGENT" || m.sender_type === "ADMIN" ? "me" : "customer",
        
        //  ส่ง 2 ค่านี้ไปให้หน้าบ้านแยกแยะ
        sender_type: m.sender_type, 
        senderName: m.sender_type === "AGENT" || m.sender_type === "ADMIN" 
            ? (userMap[m.sender_id] || "Agent") 
            : (chat.customer?.name || "ลูกค้า"),
            
        text: m.content,
        type: m.message_type,
        time: m.created_at.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    }));

    return Response.json(formatted);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}