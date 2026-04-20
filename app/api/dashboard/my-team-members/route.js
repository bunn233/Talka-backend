import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const myId = session?.user?.id ? Number(session.user.id) : null;

    const currentUser = await prisma.user.findUnique({
      where: { user_id: myId },
      select: { current_workspace_id: true }
    });

    if (!currentUser?.current_workspace_id) {
      return NextResponse.json({
        teamName: "No Workspace Selected",
        members: []
      });
    }

    // 1. ดึงข้อมูลสมาชิกจากตาราง WorkspaceMember อิงตาม workspace ปัจจุบัน 
    const wsMembers = await prisma.workspaceMember.findMany({
      where: {
        workspace_id: currentUser.current_workspace_id,
        role: { notIn: ['USER'] }
      },
      include: {
        user: true,
        workspace: true
      },
      take: 20, 
      orderBy: { joined_at: 'desc' }
    });

    const teamName = wsMembers.length > 0 ? wsMembers[0].workspace.name : "Support Team";

    // 2. แปลงข้อมูลให้หน้าตาเหมือนที่ Frontend ต้องการเป๊ะๆ
    const formattedMembers = wsMembers.map(member => {
      const u = member.user;
      return {
        id: u.user_id,
        name: u.username,
        role: member.role, // ดึงตำแหน่งจากสิทธิ์ใน Workspace
        isMe: u.user_id === myId,
        isOnline: u.online_status === 'ONLINE',
        avatar: u.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=random`
      };
    });

    // 3. จัดเรียงตามเงื่อนไข: 
    // OWNER -> ADMIN -> EMPLOYEE
    const roleWeight = {
      "OWNER": 1,
      "MANAGER": 1,
      "ADMIN": 2,
      "EMPLOYEE": 3
    };

    formattedMembers.sort((a, b) => {

      const weightA = roleWeight[a.role?.toUpperCase()] || 99;
      const weightB = roleWeight[b.role?.toUpperCase()] || 99;
      
      return weightA - weightB;
    });

    // 4. ส่งข้อมูลกลับไปให้หน้าเว็บ
    return NextResponse.json({
      teamName: teamName, 
      members: formattedMembers
    });

  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" }, 
      { status: 500 }
    );
  }
}