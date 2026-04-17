import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { pusherServer } from "@/lib/pusher";

const prisma = new PrismaClient();

// อัปเดตข้อมูล Tag (PATCH) - [อัปเดตสี]
export async function PATCH(request, { params }) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        
        const body = await request.json();
        const { color } = body;

        const updatedTag = await prisma.tag.update({
            where: { tag_id: id },
            data: { color: color },
        });

        // 🔥 2. ตะโกนบอกแชทว่า "สี Tag เปลี่ยน!"
        try {
            await pusherServer.trigger('global-tags', 'tag-updated', { message: "Tag updated" });
        } catch (e) { console.error("Pusher error:", e); }

        return NextResponse.json({ success: true, tag: updatedTag });
    } catch (error) {
        console.error("Error updating tag:", error);
        return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
    }
}

// ลบ Tag (DELETE)
export async function DELETE(request, { params }) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);

        // ลบการเชื่อมต่อระหว่าง Tag กับ Chat
        await prisma.chatTag.deleteMany({
            where: { tag_id: id },
        });
        // ลบการเชื่อมต่อระหว่าง Tag กับ Customer
        await prisma.customerTag.deleteMany({
            where: { tag_id: id },
        });

        // ลบ Tag หลัก
        await prisma.tag.delete({
            where: { tag_id: id },
        });

        try {
            await pusherServer.trigger('global-tags', 'tag-updated', { message: "Tag deleted" });
        } catch (e) { console.error("Pusher error:", e); }

        return NextResponse.json({ success: true, message: "Tag deleted successfully" });
    } catch (error) {
        console.error("Error deleting tag:", error);
        return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
    }
}