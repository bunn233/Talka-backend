import { prisma } from "@/lib/prisma";

export async function GET(req, context) {
    try {
        const { messageId } = await context.params;

        // 1. ดึง Access Token จากแชนเนล LINE ล่าสุด
        const channel = await prisma.channel.findFirst({
            where: { platform_name: "LINE" },
            orderBy: { channel_id: 'desc' }
        });

        if (!channel) return new Response("Channel not found", { status: 404 });

        // 2. ยิงไปขอไฟล์รูปจาก LINE Data API
        const lineRes = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
            headers: {
                Authorization: `Bearer ${channel.line_access_token}`,
            },
        });

        if (!lineRes.ok) throw new Error("Failed to fetch image from LINE");

        // 3. ส่งข้อมูลรูปภาพกลับไปให้ Browser โชว์
        const contentType = lineRes.headers.get("content-type");
        const arrayBuffer = await lineRes.arrayBuffer();

        return new Response(arrayBuffer, {
            headers: {
                "Content-Type": contentType || "image/jpeg",
                "Cache-Control": "public, max-age=86400", // เก็บ cache ไว้ 1 วัน
            },
        });

    } catch (error) {
        console.error("❌ Line Image Proxy Error:", error);
        return new Response("Image error", { status: 500 });
    }
}