import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. ดึงข้อมูลแชทล่าสุด 10 รายการ พร้อมดึงข้อมูลลูกค้า, ช่องทาง (แพลตฟอร์ม) และ แท็ก มาด้วย!
    const recentChats = await prisma.chatSession.findMany({
      take: 10,
      orderBy: { start_time: 'desc' }, // เรียงจากคนทักมาล่าสุด
      include: {
        customer: true,
        platform: true,
        tags: {
          include: { tag: true }
        }
      }
    });

    // 2. แปลงข้อมูลให้ตรงกับที่หน้าเว็บ Frontend ต้องการเป๊ะๆ
    const formattedContacts = recentChats.map(chat => ({
      id: chat.chat_session_id,
      name: chat.customer.name,
      channel: chat.platform.platform_name, // เช่น Facebook, Line
      status: chat.status, // OPEN, PENDING, CLOSED 
      tags: chat.tags.map(ct => ct.tag.tag_name), // แกะเอาเฉพาะชื่อแท็กออกมาเป็น Array
      imgUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.customer.name)}&background=random`
    }));

    // 3. ส่งข้อมูลกลับไปให้หน้าเว็บ
    return NextResponse.json(formattedContacts);

  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" }, 
      { status: 500 }
    );
  }
}