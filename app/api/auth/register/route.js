import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// ฟังก์ชันสุ่มรหัส OTP 6 หลัก
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    // 1. เช็คว่ามีอีเมลนี้ในระบบหรือยัง
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 });
    }

    // 2. เข้ารหัสผ่าน และ สร้าง OTP
    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = generateOTP();
    const expiryDate = new Date(new Date().getTime() + 30 * 60000); // ให้รหัสหมดอายุใน 30 นาที

    // 3. บันทึกข้อมูลลง Database (พร้อม OTP)
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        verificationToken: otpCode, // บันทึกรหัส 6 หลัก
        tokenExpiry: expiryDate,    // บันทึกเวลาหมดอายุ
      },
    });

    // 4. ตั้งค่าระบบส่งอีเมล (Nodemailer)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 5. หน้าตาของอีเมลที่จะส่งไปหาลูกค้า
    const mailOptions = {
      from: `"Talka Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Confirm your email address - Talka',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #333; padding: 40px 20px; background-color: #f9fafb;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 40px 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h1 style="color: #9333ea; margin-bottom: 5px; font-size: 28px;">Talka</h1>
                <h2 style="font-size: 20px; color: #111827; margin-bottom: 10px;">Confirm your email address</h2>
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
                    Enter this code on the confirmation screen.<br/>
                    This code expires in 30 minutes.
                </p>
                <div style="margin: 30px auto; padding: 15px; background: #f3f4f6; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827; border-radius: 12px;">
                    ${otpCode}
                </div>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
                    If you didn't sign up for Talka, please ignore this email.
                </p>
            </div>
        </div>
      `
    };

    // 6. สั่งส่งอีเมล
    await transporter.sendMail(mailOptions);

    // 7. ตอบกลับหน้าเว็บว่าสำเร็จ เพื่อให้หน้าเว็บเปลี่ยนไปหน้ากรอก OTP
    return NextResponse.json({ 
        success: true, 
        message: "โปรดเช็คอีเมลเพื่อรับรหัสยืนยัน 6 หลัก" 
    }, { status: 201 });

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ หรือการส่งอีเมลล้มเหลว" }, { status: 500 });
  }
}