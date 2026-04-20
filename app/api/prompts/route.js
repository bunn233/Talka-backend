<<<<<<< HEAD
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
=======
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
>>>>>>> 0f0b53d466af6c42d8dfc0b30a0e2c17c0cebb97
  }
}