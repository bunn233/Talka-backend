import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized: กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    }

    // ดักผู้ใช้ Google (ไม่มีรหัสผ่านในระบบ)
    if (!user.password) {
      return NextResponse.json({ 
        message: "บัญชีของคุณเข้าสู่ระบบผ่าน Google จึงไม่สามารถเปลี่ยนรหัสผ่านในระบบได้" 
      }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" }, { status: 200 });

  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์", error: error.message }, { status: 500 });
  }
}