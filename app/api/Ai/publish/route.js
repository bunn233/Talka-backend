import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
    try {
        // 1. ดึง Session เพื่อหาว่าใครกำลังใช้งานอยู่
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. ดึงข้อมูล User เพื่อเอา current_workspace_id
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { current_workspace_id: true }
        });

        if (!user?.current_workspace_id) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 400 });
        }

        const body = await req.json();
        
        const { 
            id, name, emoji, greetingMsg, instructions, tone, 
            guardrails, leadGen, handover, isPublished 
        } = body;

        let savedAgent;

        if (id) {
            // 🚨 ป้องกันความปลอดภัย: ตรวจสอบก่อนว่าบอทตัวนี้เป็นของ Workspace เราจริงๆ
            const existingAgent = await prisma.aiAgent.findUnique({ 
                where: { id: parseInt(id) } 
            });

            if (!existingAgent || existingAgent.workspace_id !== user.current_workspace_id) {
                return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไข AI Agent ตัวนี้" }, { status: 403 });
            }

            // ถ้าตรวจสอบผ่านแล้วค่อยอัปเดต
            savedAgent = await prisma.aiAgent.update({
                where: { id: parseInt(id) },
                data: {
                    name, emoji, greeting: greetingMsg, instructions,
                    tone, guardrails, lead_gen: leadGen, handover, is_published: isPublished
                }
            });
        } else {
            // 🟢 ตอนสร้างใหม่ ต้องแนบ workspace_id เสมอ
            savedAgent = await prisma.aiAgent.create({
                data: {
                    workspace_id: user.current_workspace_id, // 👈 เพิ่มบรรทัดนี้แล้ว!
                    name: name || "Talka AI",
                    emoji: emoji || "🤖",
                    greeting: greetingMsg || "สวัสดีค่ะ",
                    instructions: instructions || "",
                    tone: tone || "professional",
                    guardrails: guardrails || "",
                    lead_gen: leadGen || {},
                    handover: handover || {},
                    is_published: isPublished ?? true, // ใช้ ?? เผื่อกรณีเค้าส่งค่า false มา
                }
            });
        }

        return NextResponse.json({ success: true, agent: savedAgent }, { status: 200 });

    } catch (error) {
        console.error("Publish Error:", error);
        return NextResponse.json({ error: "ไม่สามารถบันทึกข้อมูลได้" }, { status: 500 });
    }
}