import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/line/chat-sessions:
 *   get:
 *     tags:
 *       - Chat Sessions
 *     summary: Get all LINE chat sessions
 *     description: Retrieve all LINE chat sessions with customer information, messages, tags, and assigned user details
 *     responses:
 *       200:
 *         description: Successfully retrieved chat sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Chat session ID
 *                   customerId:
 *                     type: string
 *                     description: Customer ID
 *                   name:
 *                     type: string
 *                     description: Customer name
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Customer email
 *                   phone:
 *                     type: string
 *                     description: Customer phone
 *                   company:
 *                     type: string
 *                     description: Customer company
 *                   country:
 *                     type: string
 *                     description: Customer country
 *                   status:
 *                     type: string
 *                     enum: [OPEN, PENDING, CLOSED, RESOLVED]
 *                     description: Chat session status
 *                   platform:
 *                     type: string
 *                     description: Platform name (LINE)
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Tag IDs associated with the chat
 *                   messages:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Message ID
 *                         from:
 *                           type: string
 *                           enum: [customer, me]
 *                           description: Message sender
 *                         text:
 *                           type: string
 *                           description: Message content
 *                         type:
 *                           type: string
 *                           description: Message type
 *                         time:
 *                           type: string
 *                           description: Message time (formatted)
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           description: Message timestamp
 *                   assignedTo:
 *                     type: string
 *                     description: Assigned user ID
 *                   assignedToName:
 *                     type: string
 *                     description: Assigned user name
 *                   time:
 *                     type: string
 *                     description: Chat session start time (formatted)
 *                   lastMessage:
 *                     type: string
 *                     description: Last message content
 *                   openTime:
 *                     type: string
 *                     format: date-time
 *                     description: Chat session open time
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export async function GET(req) {
    try {
        // ดึง chats ที่เป็น LINE เท่านั้น
        const chats = await prisma.chatSession.findMany({
            include: {
                customer: {
                    include: {
                        social_accounts: true,
                        tags: true,
                    }
                },
                platform: true,
                messages: {
                    orderBy: { created_at: "asc" },
                    take: 50, // จำกัด 50 ข้อความล่าสุด
                },
                tags: true,
                assigned_user: {
                    select: {
                        user_id: true,
                        username: true,
                        profile_image: true
                    }
                }
            },
            orderBy: {
                start_time: "desc",
            },
        });

        // Format ข้อมูลให้เหมาะสม
        const formattedChats = chats.map(chat => ({
            id: chat.chat_session_id,
            customerId: chat.customer_id,
            name: chat.customer.name,
            email: chat.customer.email,
            phone: chat.customer.phone,
            company: chat.customer.company,
            country: chat.customer.country,
            status: chat.status, // OPEN, PENDING, CLOSED, RESOLVED
            platform: chat.platform.platform_name,
            tags: chat.tags.map(t => t.tag_id),
            messages: chat.messages.map(m => ({
                id: m.message_id,
                from: m.sender_type === "CUSTOMER" ? "customer" : "me",
                text: m.content,
                type: m.message_type,
                time: m.created_at.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                timestamp: m.created_at
            })),
            assignedTo: chat.assigned_user?.user_id,
            assignedToName: chat.assigned_user?.username,
            time: chat.start_time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            lastMessage: chat.messages[chat.messages.length - 1]?.content || "No messages",
            openTime: chat.start_time,
        }));

        return Response.json(formattedChats);
    } catch (error) {
        console.error("❌ Error fetching chat sessions:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}