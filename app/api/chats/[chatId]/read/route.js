import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req, context) {
    try {

        const params = await context.params; 
        const chatId = parseInt(params.chatId); 

        if (!chatId) {
            return NextResponse.json({ error: "Invalid Chat ID" }, { status: 400 });
        }

        const updated = await prisma.message.updateMany({
            where: {
                chat_session_id: chatId,
                is_read: false,
                sender_type: "CUSTOMER"
            },
            data: {
                is_read: true
            }
        });
        return NextResponse.json({ success: true, updatedCount: updated.count });

    } catch (error) {
        console.error("❌ [Read API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}