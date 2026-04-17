import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 🟢 1. ฟังก์ชันดึงข้อมูลโปรไฟล์ (ของเดิม)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaces: {
          include: { workspace: true }
        }
      }
    });

    if (!userProfile) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const myWorkspaces = userProfile.workspaces.map(wm => ({
        id: String(wm.workspace.workspace_id),
        name: wm.workspace.name,
        role: wm.role 
    }));

    return NextResponse.json({ 
        profile: {
            user_id: userProfile.user_id,
            username: userProfile.username,
            email: userProfile.email,
            profile_image: userProfile.profile_image,
            online_status: userProfile.online_status,
            role: userProfile.role
        },
        workspaces: myWorkspaces 
    }, { status: 200 });

  } catch (error) {
    console.error("GET Profile Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

// 🟢 2. ฟังก์ชันอัปเดตโปรไฟล์ (เพิ่มเข้ามาใหม่! แก้ Error 405)
export async function PATCH(request) {
  try {
    // เช็คสิทธิ์ว่า Login อยู่ไหม
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized: กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // รับข้อมูลที่ส่งมาจากหน้าเว็บ
    const body = await request.json();
    const { username, online_status, profile_image } = body;

    // อัปเดตข้อมูลลงฐานข้อมูล
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        username: username,
        online_status: online_status,
        profile_image: profile_image,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "อัปเดตโปรไฟล์สำเร็จ", 
      profile: updatedUser 
    }, { status: 200 });

  } catch (error) {
    console.error("PATCH Profile Error:", error);
    return NextResponse.json({ message: "ไม่สามารถอัปเดตโปรไฟล์ได้", error: error.message }, { status: 500 });
  }
}