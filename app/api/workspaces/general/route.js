import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { pusherServer } from "@/lib/pusher";

// 🟢 GET: ดึงข้อมูล Workspace
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // รับ workspaceId จาก URL Params (เช่น ?wsId=1)
        const url = new URL(req.url);
        const wsId = url.searchParams.get("wsId");

        if (!wsId) return NextResponse.json({ error: "Missing Workspace ID" }, { status: 400 });

        // ดึงข้อมูล User และเช็คสิทธิ์ใน Workspace นี้
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { user_id: true }
        });

        const memberCheck = await prisma.workspaceMember.findFirst({
            where: { workspace_id: parseInt(wsId), user_id: user.user_id }
        });

        if (!memberCheck) {
            return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง Workspace นี้" }, { status: 403 });
        }

        // นับ Monthly Chats แบบง่ายๆ ก่อน
        // ดึงแชททั้งหมดใน Workspace ภายในเดือนปัจจุบัน
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyChatsCount = await prisma.chatSession.count({
            where: {
                channel: { workspace_id: parseInt(wsId) },
                start_time: { gte: firstDayOfMonth }
            }
        });

        // ดึงข้อมูล Workspace
        const workspace = await prisma.workspace.findUnique({
            where: { workspace_id: parseInt(wsId) },
            include: {
                _count: {
                    select: { members: true, channels: true }
                },
                members: {
                    where: { role: 'Owner' },
                    include: { user: { select: { company_size: true } } }
                }
            }
        });

        let maxUsers = 10;
        const owner = workspace?.members?.[0]?.user;
        if (owner && owner.company_size) {
            const sizeStr = owner.company_size;
            if (sizeStr.includes('+')) {
                const num = parseInt(sizeStr.replace('+', ''));
                maxUsers = isNaN(num) ? 999 : num * 5; 
            } else if (sizeStr.includes('-')) {
                const parts = sizeStr.split('-');
                const max = parseInt(parts[1]);
                if (!isNaN(max)) maxUsers = max;
            } else {
                const num = parseInt(sizeStr);
                if (!isNaN(num)) maxUsers = num;
            }
        }

        return NextResponse.json({ 
            success: true, 
            workspace, 
            userRole: memberCheck.role,
            monthlyChats: monthlyChatsCount,
            maxUsers: maxUsers
        });

    } catch (error) {
        console.error("GET Workspace Info Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 🟢 PUT: อัปเดตข้อมูล Workspace
export async function PUT(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { wsId, name } = body;

        if (!wsId || !name) return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { user_id: true }
        });

        const memberCheck = await prisma.workspaceMember.findFirst({
            where: { 
                workspace_id: parseInt(wsId), 
                user_id: user.user_id,
                role: "Owner" // Only Owner can edit
            }
        });

        if (!memberCheck) {
            return NextResponse.json({ error: "คุณไม่มีสิทธิ์แก้ไข Workspace นี้" }, { status: 403 });
        }

        const updatedWs = await prisma.workspace.update({
            where: { workspace_id: parseInt(wsId) },
            data: { name: name }
        });

      
        try {
            await pusherServer.trigger(`workspace-${wsId}`, 'workspace-updated', {
                message: "อัปเดตข้อมูลพื้นที่ทำงานแล้ว"
            });
        } catch (e) { console.error("Pusher Error:", e); }

        return NextResponse.json({ success: true, workspace: updatedWs });

    } catch (error) {
        console.error("UPDATE Workspace Info Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 🔴 DELETE: ลบ Workspace
export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { wsId } = body;

        if (!wsId) return NextResponse.json({ error: "Missing Workspace ID" }, { status: 400 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { user_id: true }
        });

        // เฉพาะ Owner ถึงลบได้
        const memberCheck = await prisma.workspaceMember.findFirst({
            where: { 
                workspace_id: parseInt(wsId), 
                user_id: user.user_id,
                role: "Owner" // ต้องเป็น Owner เท่านั้น (อิงจาก Enum Role "Owner")
            }
        });

        if (!memberCheck) {
            return NextResponse.json({ error: "มีเฉพาะ Owner เท่านั้นที่สามารถลบ Workspace ได้" }, { status: 403 });
        }

        // ลบ Workspace (Cascade จะทำงานลบทุกอย่างที่เกี่ยวกับ Workspace)
        await prisma.workspace.delete({
            where: { workspace_id: parseInt(wsId) }
        });

        return NextResponse.json({ success: true, message: "Workspace deleted successfully." });
    } catch (error) {
        console.error("DELETE Workspace Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}