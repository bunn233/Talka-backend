import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json([]);
        }
        const invites = await prisma.workspaceInvite.findMany({
            where: { 
                invitee_email: session.user.email, 
                status: "PENDING" 
            },
            include: { 
                workspace: {
                    select: { name: true }
                }, 
                inviter: {
                    select: { username: true, email: true }
                } 
            }
        });

        return NextResponse.json(invites);
    } catch (error) {
        console.error("❌ Fetch Invites Error:", error);
        return NextResponse.json([]);
    }
}

// กดตอบรับ/ปฏิเสธคำเชิญ
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        const { inviteId, action } = await req.json();

        const invite = await prisma.workspaceInvite.findUnique({ where: { invite_id: inviteId } });
        if (!invite || invite.status !== "PENDING") return NextResponse.json({ error: "คำเชิญไม่ถูกต้องหรือหมดอายุ" }, { status: 400 });

        if (action === "ACCEPT") {
            // 1. เพิ่มผู้ใช้เข้า Workspace
            await prisma.workspaceMember.create({
                data: {
                    workspace_id: invite.workspace_id,
                    user_id: currentUser.user_id,
                    role: invite.role
                }
            });
            
            // 2. อัปเดตสถานะคำเชิญเป็นยอมรับแล้ว
            await prisma.workspaceInvite.update({ where: { invite_id: inviteId }, data: { status: "ACCEPTED" } });
            
            // 3. ตะโกนบอกทีมว่ามีสมาชิกใหม่เข้าทีมแล้ว
            try {
                await pusherServer.trigger(`workspace-${invite.workspace_id}`, 'workspace-updated', {
                    message: "มีสมาชิกใหม่เข้าร่วมทีม"
                });
            } catch (e) { console.error("Pusher Error:", e); }

            //  รีเทิร์นค่า workspace_id กลับไปให้ฝั่ง Frontend ด้วย จะได้สั่งเด้งหน้าได้
            return NextResponse.json({ success: true, workspace_id: invite.workspace_id });

        } else {
            await prisma.workspaceInvite.update({ where: { invite_id: inviteId }, data: { status: "DECLINED" } });
            return NextResponse.json({ success: true });
        }

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}