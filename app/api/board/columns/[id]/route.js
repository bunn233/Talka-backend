import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

// 🟢 1. ฟังก์ชันสำหรับ "ลบคอลัมน์" (DELETE)
export async function DELETE(req, context) {
    try {
        const params = await context.params;
        const columnId = params.id;

        if (!columnId) {
            return NextResponse.json({ error: "ไม่พบ ID ของคอลัมน์" }, { status: 400 });
        }

        if (columnId === "col-1") {
            return NextResponse.json({ error: "ไม่สามารถลบ Inbox หลักได้" }, { status: 400 });
        }

        await prisma.chatSession.updateMany({
            where: { board_column_id: columnId },
            data: { board_column_id: "col-1" }
        });

        await prisma.boardColumn.delete({
            where: { column_id: columnId }
        });

        console.log(`✅ ลบคอลัมน์ ${columnId} สำเร็จ`);

        // 🔥 2. ตะโกนบอกทุกทีม (เพราะตอนนี้บอร์ดยังไม่แยกทีม)
        try {
            await pusherServer.trigger('global-board', 'board-layout-updated', { message: "คอลัมน์ถูกลบ" });
        } catch (e) { console.error("Pusher Error:", e); }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("❌ Delete Column Error:", error);
        return NextResponse.json({ error: "ลบคอลัมน์ใน Database ไม่สำเร็จ" }, { status: 500 });
    }
} 

// 🟢 2. อัปเดตชื่อคอลัมน์ (PATCH)
export async function PATCH(req, context) {
    try {
        const params = await context.params;
        const columnId = params.id;
        const { title } = await req.json();

        if (!columnId || !title) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        const updatedCol = await prisma.boardColumn.update({
            where: { column_id: columnId },
            data: { title: title }
        });

        //  3. ตะโกนบอกทุกคน
        try {
            await pusherServer.trigger('global-board', 'board-layout-updated', { message: "คอลัมน์ถูกเปลี่ยนชื่อ" });
        } catch (e) { console.error("Pusher Error:", e); }

        return NextResponse.json({ success: true, column: updatedCol });

    } catch (error) {
        console.error("❌ Update Column Error:", error);
        return NextResponse.json({ error: "ไม่สามารถอัปเดตคอลัมน์ได้" }, { status: 500 });
    }
}