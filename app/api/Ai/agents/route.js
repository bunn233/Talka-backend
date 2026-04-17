import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // เช็ค path ของ prisma ให้ตรงกับโปรเจกต์ของคุณ

// ==========================================
// 1. GET: ดึงข้อมูล Agent ทั้งหมดมาโชว์ในตาราง
// ==========================================
export async function GET() {
    try {
        const agents = await prisma.aiAgent.findMany({
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json(agents, { status: 200 });
    } catch (error) {
        console.error("Fetch Agents Error:", error);
        return NextResponse.json({ error: "ไม่สามารถดึงข้อมูล Agent ได้" }, { status: 500 });
    }
}

// ==========================================
// 2. DELETE: รับคำสั่งลบ Agent จากหน้าเว็บ
// ==========================================
export async function DELETE(req) {
    try {
        // ดึง id ที่แนบมากับ URL (เช่น /api/Ai/agents?id=5)
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ไม่พบ ID ที่ต้องการลบ" }, { status: 400 });
        }

        // สั่งลบข้อมูลออกจาก MySQL ผ่าน Prisma
        await prisma.aiAgent.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true, message: "ลบ Agent สำเร็จ" }, { status: 200 });

    } catch (error) {
        console.error("Delete Agent Error:", error);
        return NextResponse.json({ error: "ไม่สามารถลบ Agent ได้" }, { status: 500 });
    }
}