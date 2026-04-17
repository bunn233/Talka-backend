import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher"; 

// ------------------------------------------------------
// 🟢 1. แก้ไขสิทธิ์ (PATCH)
// ------------------------------------------------------
export async function PATCH(req, context) {
    try {
        const params = await context.params;
        const targetUserId = parseInt(params.id); 
        const body = await req.json();
        const { role, workspaceId } = body; 

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const me = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const myAccess = await prisma.workspaceMember.findFirst({
            where: { user_id: me.user_id, workspace_id: parseInt(workspaceId) }
        });
        const myRole = myAccess?.role?.toUpperCase() || "EMPLOYEE";

        if (!myAccess || (myRole !== "ADMIN" && myRole !== "OWNER")) {
            return NextResponse.json({ error: "FORBIDDEN", message: "คุณไม่มีสิทธิ์ระดับผู้ดูแลระบบในการแก้ไขข้อมูลนี้" }, { status: 403 });
        }

        const targetMember = await prisma.workspaceMember.findUnique({
            where: { workspace_id_user_id: { workspace_id: parseInt(workspaceId), user_id: targetUserId } }
        });
        if (targetMember && targetMember.role.toUpperCase() === "OWNER") {
            return NextResponse.json({ error: "ไม่อนุญาตให้แก้ไขสิทธิ์ของเจ้าของพื้นที่ทำงาน (Owner)" }, { status: 403 });
        }

        const updatedMember = await prisma.workspaceMember.update({
            where: { workspace_id_user_id: { workspace_id: parseInt(workspaceId), user_id: targetUserId } },
            data: { role: role }
        });

        await prisma.user.update({
            where: { user_id: targetUserId },
            data: { role: role }
        });

        // 🔥 2. ตะโกนบอกทีม และ กระซิบไปหาคนโดนเปลี่ยนยศให้รีเฟรชสิทธิ์ตัวเอง
        try {
            await pusherServer.trigger(`workspace-${workspaceId}`, 'workspace-updated', {
                message: "มีการเปลี่ยนยศสมาชิกในทีม"
            });
            // กระซิบหาเจ้าตัวโดยตรง เพื่อให้แผงเมนูอัปเดตแบบ Real-time
            await pusherServer.trigger(`user-${targetUserId}`, 'user_updated', {
                message: "สิทธิ์การเข้าถึงของคุณถูกอัปเดต"
            });
        } catch (e) { console.error("Pusher Error:", e); }

        return NextResponse.json({ success: true, role: updatedMember.role });

    } catch (error) {
        console.error("PATCH Member Error:", error);
        return NextResponse.json({ error: "ไม่สามารถอัปเดตสิทธิ์ได้" }, { status: 500 });
    }
}

// ------------------------------------------------------
// 🔴 2. ลบคนออกจากทีม (DELETE)
// ------------------------------------------------------
export async function DELETE(req, context) {
    try {
        const params = await context.params;
        const targetUserId = parseInt(params.id); 
        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get("wsId");

        if (!workspaceId) return NextResponse.json({ error: "Missing Workspace ID" }, { status: 400 });

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const me = await prisma.user.findUnique({ where: { email: session.user.email } });
        const myAccess = await prisma.workspaceMember.findFirst({
            where: { user_id: me.user_id, workspace_id: parseInt(workspaceId) }
        });

        const myRole = myAccess?.role?.toUpperCase() || "EMPLOYEE";
        if (!myAccess || (myRole !== "ADMIN" && myRole !== "OWNER")) {
            return NextResponse.json({ error: "FORBIDDEN", message: "คุณไม่มีสิทธิ์ระดับผู้ดูแลระบบในการลบสมาชิก" }, { status: 403 });
        }

        const targetMember = await prisma.workspaceMember.findUnique({
            where: { workspace_id_user_id: { workspace_id: parseInt(workspaceId), user_id: targetUserId } }
        });
        if (targetMember && targetMember.role.toUpperCase() === "OWNER") {
            return NextResponse.json({ error: "ไม่สามารถลบเจ้าของพื้นที่ทำงาน (Owner) ออกจากทีมได้" }, { status: 403 });
        }

        const targetUser = await prisma.user.findUnique({ where: { user_id: targetUserId }});

        await prisma.workspaceMember.delete({
            where: { workspace_id_user_id: { workspace_id: parseInt(workspaceId), user_id: targetUserId } }
        });

        if (targetUser) {
            await prisma.workspaceInvite.deleteMany({
                where: { workspace_id: parseInt(workspaceId), invitee_email: targetUser.email }
            });
            await prisma.user.update({
                where: { user_id: targetUserId },
                data: { role: "EMPLOYEE" }
            });
        }

        try {
            // สั่งเครื่องของคนที่โดนเตะให้เด้งไปหน้ารอทันที
            await pusherServer.trigger(`user-${targetUserId}`, 'kicked-out', {
                message: "คุณถูกนำออกจากทีม"
            });

            // สั่งหน้าจอคนในทีมให้ลบชื่อคนนี้ออกจากรายการทันที
            await pusherServer.trigger(`workspace-${workspaceId}`, 'workspace-updated', {
                message: "มีสมาชิกถูกลบออกจากทีม"
            });
        } catch (e) { console.error("Pusher Error:", e); }

        return NextResponse.json({ success: true, message: "ลบผู้ใช้และเคลียร์ประวัติสำเร็จ" });

    } catch (error) {
        console.error("DELETE Member Error:", error);
        return NextResponse.json({ error: "ไม่สามารถลบผู้ใช้นี้ได้" }, { status: 500 });
    }
}