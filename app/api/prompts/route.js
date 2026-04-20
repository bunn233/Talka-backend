import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🟢 ดึงข้อมูล Prompt ทั้งหมด
export async function GET() {
  try {
    const prompts = await prisma.aiPrompt.findMany({
      orderBy: { created_at: 'desc' } // เรียงจากอันใหม่ล่าสุดขึ้นก่อน
    });
    return NextResponse.json(prompts, { status: 200 });
  } catch (error) {
    console.error("Fetch Prompts Error:", error);
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

// 🟢 สร้าง Prompt ใหม่
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, action } = body;

    const newPrompt = await prisma.aiPrompt.create({
      data: {
        name,
        action,
        active: true,
        isDefault: false
      }
    });

    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    console.error("Create Prompt Error:", error);
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}