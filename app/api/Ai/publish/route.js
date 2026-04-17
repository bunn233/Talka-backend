import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
    try {
        const body = await req.json();
        
        // สังเกตว่าเราเพิ่ม id เข้ามารับค่าด้วย
        const { 
            id, name, emoji, greetingMsg, instructions, tone, 
            guardrails, leadGen, handover, isPublished 
        } = body;

        let savedAgent;

        if (id) {
            // ถ้ามี ID แสดงว่า "กด Edit มาจากหน้าแรก" ให้ทำการอัปเดตข้อมูลเดิม (Update)
            savedAgent = await prisma.aiAgent.update({
                where: { id: parseInt(id) },
                data: {
                    name, emoji, greeting: greetingMsg, instructions,
                    tone, guardrails, lead_gen: leadGen, handover, is_published: isPublished
                }
            });
        } else {
            // ถ้าไม่มี ID แสดงว่า "สร้างใหม่ (Create Custom)"
            savedAgent = await prisma.aiAgent.create({
                data: {
                    name: name || "Talka AI",
                    emoji: emoji || "🤖",
                    greeting: greetingMsg || "สวัสดีค่ะ",
                    instructions: instructions || "",
                    tone: tone || "professional",
                    guardrails: guardrails || "",
                    lead_gen: leadGen || {},
                    handover: handover || {},
                    is_published: isPublished || true,
                }
            });
        }

        return NextResponse.json({ success: true, agent: savedAgent }, { status: 200 });

    } catch (error) {
        console.error("Publish Error:", error);
        return NextResponse.json({ error: "ไม่สามารถบันทึกข้อมูลได้" }, { status: 500 });
    }
}