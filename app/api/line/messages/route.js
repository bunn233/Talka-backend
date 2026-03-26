import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/line/messages:
 *   get:
 *     tags:
 *       - Messages
 *     summary: Get messages for a chat session
 *     description: Retrieve all messages for a specific chat session
 *     parameters:
 *       - name: chat_session_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: The chat session ID to retrieve messages for
 *     responses:
 *       200:
 *         description: Successfully retrieved messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   message_id:
 *                     type: string
 *                     description: Message ID
 *                   chat_session_id:
 *                     type: string
 *                     description: Chat session ID
 *                   sender_type:
 *                     type: string
 *                     description: Sender type (CUSTOMER or USER)
 *                   content:
 *                     type: string
 *                     description: Message content
 *                   message_type:
 *                     type: string
 *                     description: Type of message (text, image, etc.)
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     description: Message creation time
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chat_session_id");

    const messages = await prisma.message.findMany({
        where: {
            chat_session_id: parseInt(chatId),
        },
        orderBy: {
            created_at: "asc",
        },
    });

    return Response.json(messages);
}