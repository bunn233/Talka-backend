<<<<<<< HEAD
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🟢 แก้ไข Prompt (อัปเดตชื่อ, คำสั่ง หรือ เปิด/ปิดสถานะ)
export async function PUT(req, { params }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await req.json();

    const updatedPrompt = await prisma.aiPrompt.update({
      where: { id: id },
      data: { ...body } 
    });

    return NextResponse.json(updatedPrompt, { status: 200 });
  } catch (error) {
    console.error("Update Prompt Error:", error);
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}

// 🟢 ลบ Prompt
export async function DELETE(req, { params }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    await prisma.aiPrompt.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete Prompt Error:", error);
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
=======
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
>>>>>>> 0f0b53d466af6c42d8dfc0b30a0e2c17c0cebb97
  }
}