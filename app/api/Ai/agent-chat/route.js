import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const { message, system_prompt_override } = body;

        if (!message) {
            return NextResponse.json({ error: "กรุณาส่งข้อความ" }, { status: 400 });
        }

        const DIFY_API_KEY = process.env.DIFY_API_KEY;
        if (!DIFY_API_KEY) {
            return NextResponse.json({ error: "ไม่ได้ตั้งค่า API Key" }, { status: 500 });
        }

        // ยิงไปหา Dify API โดยส่งคำสั่งทั้งหมดไปยัดในตัวแปร {{custom_prompt}} ที่เราตั้งไว้
        const difyResponse = await fetch('https://api.dify.ai/v1/chat-messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: {
                    custom_prompt: system_prompt_override // ตัวแปรนี้รับค่ามาจาก UI โดยตรง
                },
                query: message,
                response_mode: "blocking",
                user: "talka-live-tester" // จำลอง user id สำหรับเทสต์
            })
        });

        const difyData = await difyResponse.json();

        if (!difyResponse.ok) {
            throw new Error(difyData.message || "Dify API Error");
        }

        return NextResponse.json({ reply: difyData.answer }, { status: 200 });

    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: "AI ไม่ตอบสนอง" }, { status: 500 });
    }
}