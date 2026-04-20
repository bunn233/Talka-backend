import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/encryption";

export async function GET(req, context) {
    try {
        const params = await context.params;
        const { channelId, fileId } = params;

        const channel = await prisma.channel.findUnique({
            where: { channel_id: parseInt(channelId) }
        });
        
        if (!channel || !channel.telegram_bot_token) {
            return new Response("Not found", { status: 404 });
        }

        // 1. ถอดรหัส Token ให้อ่านออกก่อน
        const token = decryptToken(channel.telegram_bot_token);

        // 2. ขอที่อยู่ไฟล์ (File Path) จาก Telegram
        const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        
        // Telegram API จะให้ path รูปมา (เฉพาะไฟล์ไม่เกิน 20MB)
        if (!fileData.ok) return new Response("File not found or too large", { status: 404 });

        const filePath = fileData.result.file_path;

        // 3. ดาวน์โหลดไฟล์ภาพจริงๆ
        const imageRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
        
        // 🔥 ดัก Error ป้องกันจังหวะที่ดาวน์โหลดรูปไม่สำเร็จ
        if (!imageRes.ok) {
            throw new Error(`Failed to download image: ${imageRes.statusText}`);
        }

        const contentType = imageRes.headers.get("content-type");
        const arrayBuffer = await imageRes.arrayBuffer();

        // 4. ส่งกลับไปให้หน้าเว็บ
        return new Response(arrayBuffer, {
            headers: {
                "Content-Type": contentType || "image/jpeg",
                "Cache-Control": "public, max-age=86400" // Cache ไว้ 1 วัน ลดการยิง API ซ้ำ
            }
        });

    } catch (error) {
        console.error("Telegram File Proxy Error:", error);
        return new Response("Internal Error", { status: 500 });
    }
}