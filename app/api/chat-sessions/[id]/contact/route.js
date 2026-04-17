import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function PATCH(req, context) {
    try {
        const params = await context.params;
        const chatId = parseInt(params.id);
        const body = await req.json();

        if (!chatId || isNaN(chatId)) {
            return NextResponse.json({ error: "Invalid Chat ID" }, { status: 400 });
        }

        // 1. ดึงข้อมูล ChatSession เพื่อหา customer_id 
        const chatSession = await prisma.chatSession.findUnique({
            where: { chat_session_id: chatId },
            include: { channel: true }
        });

        if (!chatSession) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        // 2. อัปเดตข้อมูลลูกค้า (Customer)
        const updatedCustomer = await prisma.customer.update({
            where: { customer_id: chatSession.customer_id },
            data: {
                phone: body.phone !== undefined ? body.phone : undefined,
                email: body.email !== undefined ? body.email : undefined,
                country: body.country !== undefined ? body.country : undefined,
                company: body.company !== undefined ? body.company : undefined,
            }
        });

        // 3. กระตุ้น Pusher ให้หน้าต่างแชทรีเฟรชข้อมูล
        if (chatSession.channel?.workspace_id) {
            try {
                const wsChannel = `workspace-${chatSession.channel.workspace_id}`;
                await pusherServer.trigger(wsChannel, "chat-details-updated", { chatId: chatId });
            } catch (e) {
                console.error("Pusher Error:", e);
            }
        }

        return NextResponse.json({ success: true, customer: updatedCustomer });

    } catch (error) {
        console.error("❌ Update Contact Error:", error);
        return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
    }
}