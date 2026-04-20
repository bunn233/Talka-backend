import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// ระบบแก้ไขข้อมูล และ อัปเดตสวิตช์เปิด/ปิด (PUT)
export async function PUT(request, { params }) {
  try {
    const { id } = params; // ดึง ID จาก URL
    const body = await request.json();
    
    const updatedPrompt = await prisma.aIPrompt.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        action: body.action,
        active: body.active
      }
    });
    return NextResponse.json(updatedPrompt);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// ระบบลบข้อมูล (DELETE)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await prisma.aIPrompt.delete({
      where: { id: Number(id) }
    });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}