import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/encryption";

export async function GET(req, context) {
    try {
        const resolvedParams = await context.params;
        const messageId = resolvedParams.messageId;

        // ดึง channelId จาก URL Query (เช่น ?channelId=5)
        const { searchParams } = new URL(req.url);
        const channelIdQuery = searchParams.get("channelId");

        // 1. ค้นหา Channel ให้ตรงตัวเป๊ะๆ
        const channel = await prisma.channel.findFirst({
            where: { 
                platform_name: "LINE",
                // ถ้ามีแนบมา ให้หาตาม ID ถ้าไม่มีให้ใช้ตัวล่าสุด (เผื่อของเก่า)
                ...(channelIdQuery ? { channel_id: parseInt(channelIdQuery) } : {})
            },
            orderBy: { channel_id: 'desc' }
        });

        if (!channel) return new Response("Channel not found", { status: 404 });

        // 🚨 2. ถอดรหัส Token ก่อนเอาไปใช้งาน
        const realAccessToken = decryptToken(channel.line_access_token);

        // 3. ยิงไปขอไฟล์รูปจาก LINE Data API
        const lineRes = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
            headers: {
                Authorization: `Bearer ${realAccessToken}`,
            },
        });

        if (!lineRes.ok) throw new Error("Failed to fetch image from LINE");

        // 4. ส่งข้อมูลรูปภาพกลับไปให้ Browser โชว์
        const contentType = lineRes.headers.get("content-type");
        const arrayBuffer = await lineRes.arrayBuffer();

        return new Response(arrayBuffer, {
            headers: {
                "Content-Type": contentType || "image/jpeg",
                "Cache-Control": "public, max-age=86400", // Cache ไว้ 1 วัน
            },
        });

    } catch (error) {
        console.error("❌ Line Image Proxy Error:", error);
        return new Response("Image error", { status: 500 });
    }
}