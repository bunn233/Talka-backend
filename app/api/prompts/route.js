import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// ระบบดึงข้อมูลทั้งหมดมาโชว์ (GET)
export async function GET() {
  try {
    const prompts = await prisma.aIPrompt.findMany({
      orderBy: { createdAt: 'asc' } // เรียงตามเวลาที่สร้าง
    });
    return NextResponse.json(prompts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// ระบบเพิ่ม Prompt ใหม่ (POST)
export async function POST(request) {
  try {
    const body = await request.json();
    const newPrompt = await prisma.aIPrompt.create({
      data: {
        name: body.name,
        action: body.action,
        active: true,
        isDefault: false,
      }
    });
    return NextResponse.json(newPrompt);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}