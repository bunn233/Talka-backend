import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "โปรดกรอกอีเมล" }, { status: 400 });
        }

        // 1. ค้นหาผู้ใช้งานใน Database
        const user = await prisma.user.findUnique({
            where: { email: email.trim() }
        });

        // เพื่อความปลอดภัย: ถ้าไม่เจออีเมล ก็บอกว่าส่งสำเร็จ (ป้องกันคนสุ่มสแปมหาอีเมลในระบบ) 
        // แต่เพื่อให้พี่เทสง่ายๆ ตอนนี้ผมจะให้มันแจ้ง error ถ้าหาไม่เจอไปก่อนครับ
        if (!user) {
            return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้งานที่ใช้อีเมลนี้" }, { status: 404 });
        }

        // 2. สร้าง Token สุ่ม (ความยาว 64 ตัวอักษร) และตั้งเวลาหมดอายุ 
        const resetToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); 

        // 3. บันทึก Token ลง Database
        await prisma.user.update({
            where: { email: email.trim() },
            data: {
                verificationToken: resetToken,
                tokenExpiry: tokenExpiry
            }
        });

        // 4. สร้างลิงก์สำหรับ Reset รหัสผ่าน
        // ใช้ NEXTAUTH_URL จาก .env (เช่น ngrok หรือ localhost)
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}&email=${email}`;

        // 5. ตั้งค่า Nodemailer เพื่อเตรียมส่งอีเมล
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
            },
        });

        // 6. เนื้อหาของอีเมล
        const mailOptions = {
            from: `"Talka Support" <${process.env.EMAIL_SERVER_USER}>`,
            to: email,
            subject: "รีเซ็ตรหัสผ่านบัญชี Talka ของคุณ",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                    <h2 style="color: #5d3d99;">Talka - รีเซ็ตรหัสผ่าน</h2>
                    <p>สวัสดีคุณ <b>${user.username || 'ผู้ใช้งาน'}</b>,</p>
                    <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชี Talka ของคุณ หากคุณเป็นผู้ส่งคำขอนี้ โปรดคลิกที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #5d3d99; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">ตั้งรหัสผ่านใหม่</a>
                    </div>
                    <p style="color: #666; font-size: 14px;"><i>ลิงก์นี้จะหมดอายุในอีก 15 นาที</i></p>
                    <p style="color: #666; font-size: 14px;">หากคุณไม่ได้เป็นคนส่งคำขอนี้ โปรดละเว้นอีเมลฉบับนี้</p>
                    <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px; text-align: center;">ทีมงาน Talka Workspace</p>
                </div>
            `,
        };

        // 7. สั่งส่งอีเมล!
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: "ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว" });

    } catch (error) {
        console.error("❌ Forgot Password Error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
    }
}