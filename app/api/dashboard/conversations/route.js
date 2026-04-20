import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // 1. รับค่าตัวเลือกจากหน้าเว็บ (เช่น 'Today', 'Last 7 Days')
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "Today";

    // 2. ดึงข้อมูลแชททั้งหมดจากฐานข้อมูล
    const chats = await prisma.chatSession.findMany();

    // 3. โครงสร้างกราฟว่างๆ รอรับข้อมูล
    let chartData = [];

    if (period === "Today" || period === "Yesterday") {
      chartData = [
        { time: "00:00", opened: 0, closed: 0 }, { time: "03:00", opened: 0, closed: 0 },
        { time: "06:00", opened: 0, closed: 0 }, { time: "09:00", opened: 0, closed: 0 },
        { time: "12:00", opened: 0, closed: 0 }, { time: "15:00", opened: 0, closed: 0 },
        { time: "18:00", opened: 0, closed: 0 }, { time: "21:00", opened: 0, closed: 0 },
        { time: "24:00", opened: 0, closed: 0 },
      ];
      
      // จับยัดแชทลงกราฟตามชั่วโมง
      chats.forEach(chat => {
        const hour = new Date(chat.start_time).getHours();
        let index = Math.floor(hour / 3); // จัดกลุ่มทีละ 3 ชั่วโมง
        if (index > 8) index = 8;
        
        if (chat.status === "CLOSED" || chat.status === "RESOLVED") chartData[index].closed += 1;
        else chartData[index].opened += 1;
      });

    } else if (period === "Last 7 Days") {
      chartData = [
        { time: "Mon", opened: 0, closed: 0 }, { time: "Tue", opened: 0, closed: 0 },
        { time: "Wed", opened: 0, closed: 0 }, { time: "Thu", opened: 0, closed: 0 },
        { time: "Fri", opened: 0, closed: 0 }, { time: "Sat", opened: 0, closed: 0 },
        { time: "Sun", opened: 0, closed: 0 },
      ];
      // จับยัดแชทลงกราฟตามวันในสัปดาห์
      chats.forEach(chat => {
        let day = new Date(chat.start_time).getDay(); 
        let index = day === 0 ? 6 : day - 1; // แปลงให้เข้ากับ จันทร์-อาทิตย์
        if (chat.status === "CLOSED" || chat.status === "RESOLVED") chartData[index].closed += 1;
        else chartData[index].opened += 1;
      });

    } else {
      chartData = [
        { time: "Week 1", opened: 0, closed: 0 }, { time: "Week 2", opened: 0, closed: 0 },
        { time: "Week 3", opened: 0, closed: 0 }, { time: "Week 4", opened: 0, closed: 0 },
      ];
      // จับยัดแชทลงกราฟตามสัปดาห์
      chats.forEach(chat => {
        let date = new Date(chat.start_time).getDate();
        let index = Math.floor((date - 1) / 7);
        if (index > 3) index = 3;
        if (chat.status === "CLOSED" || chat.status === "RESOLVED") chartData[index].closed += 1;
        else chartData[index].opened += 1;
      });
    }

    // 4. ส่งข้อมูลกราฟของจริงกลับไปให้ Frontend
    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}