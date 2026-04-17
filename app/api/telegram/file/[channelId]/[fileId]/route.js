import { prisma } from "@/lib/prisma";

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

        const token = channel.telegram_bot_token;

        const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        
        if (!fileData.ok) return new Response("File not found", { status: 404 });

        const filePath = fileData.result.file_path;

        const imageRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
        const contentType = imageRes.headers.get("content-type");
        const arrayBuffer = await imageRes.arrayBuffer();

        return new Response(arrayBuffer, {
            headers: {
                "Content-Type": contentType || "image/jpeg",
                "Cache-Control": "public, max-age=86400"
            }
        });

    } catch (error) {
        console.error("Telegram File Error:", error);
        return new Response("Internal Error", { status: 500 });
    }
}