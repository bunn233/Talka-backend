import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 

// ทลายแคชฝั่ง Server
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const targetWsId = url.searchParams.get("wsId");

        if (!targetWsId) {
            return NextResponse.json({ error: "Missing Workspace ID" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { user_id: true }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const myWorkspace = await prisma.workspaceMember.findFirst({
            where: { 
                user_id: dbUser.user_id,
                workspace_id: parseInt(targetWsId) 
            }
        });

        if (!myWorkspace) {
            return NextResponse.json({ error: "Forbidden: Not in this workspace" }, { status: 403 });
        }

        const sessions = await prisma.chatSession.findMany({
            where: {
                channel: {
                    workspace_id: parseInt(targetWsId), 
                    status: "CONNECTED" 
                }
            },
            include: {
                customer: true,
                channel: true,
                messages: { orderBy: { created_at: 'asc' } },
                notes: { orderBy: { created_at: 'desc' } },
                tags: { include: { tag: true } }
            },
            orderBy: { chat_session_id: 'desc' }
        });

        // 🚨 เพิ่มตรงนี้: ดึงชื่อ Admin ทั้งหมดมาเตรียมไว้จับคู่ชื่อตอนกด F5
        const users = await prisma.user.findMany({ select: { user_id: true, username: true } });
        const userMap = {};
        users.forEach(u => userMap[u.user_id] = u.username);

        const uniqueSessionsMap = new Map();
        for (const session of sessions) {
            const key = `${session.customer_id}_${session.channel_id}`;
            if (!uniqueSessionsMap.has(key)) uniqueSessionsMap.set(key, session);
        }
        const filteredSessions = Array.from(uniqueSessionsMap.values());

        const formattedChats = filteredSessions.map(chat => {
            const allMessages = chat.messages || [];
            const lastMsg = allMessages[allMessages.length - 1];
            
            const unreadCount = allMessages.filter(m => m.sender_type === "CUSTOMER" && (m.is_read === false || m.is_read === null)).length;

            const chatTags = chat.tags ? chat.tags.map(ct => {
                if (!ct.tag) return null;
                const emojiMatch = ct.tag.tag_name.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)/u);
                return {
                    id: ct.tag.tag_id,
                    name: emojiMatch ? emojiMatch[2] : ct.tag.tag_name,
                    emoji: emojiMatch ? emojiMatch[1] : "🏷️",
                    color: ct.tag.color || "#BE7EC7"
                };
            }).filter(Boolean) : [];

            return {
                id: chat.chat_session_id,
                board_column_id: chat.board_column_id || "col-1", 
                name: chat.customer?.name || "Unknown User",
                imgUrl: chat.customer?.image || null,
                channelName: chat.channel?.name || "",
                phone: chat.customer?.phone || "",
                email: chat.customer?.email || "",
                country: chat.customer?.country || "",
                status: chat.status || "OPEN",
                platform: String(chat.channel?.platform_name || "UNKNOWN").toUpperCase(),
                tags: chatTags,
                notes: chat.notes ? chat.notes.map(n => ({
                    id: n.note_id,
                    title: n.title,
                    text: n.content || n.text,
                    timestamp: n.created_at
                })) : [],
                unreadCount: unreadCount,
                lastMessage: lastMsg ? lastMsg.content : "ไม่มีข้อความ",
                messages: allMessages.map(msg => ({
                    id: msg.message_id,
                    from: msg.sender_type === "AGENT" || msg.sender_type === "ADMIN" ? "me" : "customer",
                    sender_type: msg.sender_type,
                    senderName: (msg.sender_type === "AGENT" || msg.sender_type === "ADMIN") 
                        ? (userMap[msg.sender_id] || "Agent") 
                        : (chat.customer?.name || "ลูกค้า"),
                        
                    text: msg.content,
                    type: msg.message_type,
                    time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ""
                }))
            };
        });

        return NextResponse.json(formattedChats, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        });
    } catch (error) {
        console.error("❌ GET Sessions Error:", error);
        return NextResponse.json([], { status: 500 });
    }
}