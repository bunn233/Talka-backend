import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 🟢 ใช้ตัวแปร prisma จาก lib กลาง
import { pusherServer } from "@/lib/pusher";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ดึงข้อมูล Tag ของตัวเอง (GET)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. หาข้อมูล User เพื่อเอา current_workspace_id
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { current_workspace_id: true }
        });

        if (!user?.current_workspace_id) return NextResponse.json([]);

        // 2. ดึงเฉพาะ Tag ที่เป็นของ Workspace นี้เท่านั้น
        const tags = await prisma.tag.findMany({
            where: { workspace_id: user.current_workspace_id },
            orderBy: { tag_id: 'desc' } 
        });

        const formattedTags = tags.map((tag) => {
            const emojiMatch = tag.tag_name.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)/u);
            const emoji = emojiMatch ? emojiMatch[1] : "🏷️";
            const name = emojiMatch ? emojiMatch[2] : tag.tag_name;

            return {
                id: tag.tag_id,
                name: name,
                color: tag.color,
                description: tag.description,
                emoji: emoji
            };
        });

        return NextResponse.json(formattedTags);
    } catch (error) {
        console.error("Error fetching tags:", error);
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }
}

// สร้าง Tag ใหม่ (POST)
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { current_workspace_id: true }
        });

        if (!user?.current_workspace_id) return NextResponse.json({ error: "No Workspace Found" }, { status: 400 });

        const body = await request.json();
        const { name, color, description, emoji } = body;

        const combinedName = emoji ? `${emoji} ${name}` : name;

        // 3. สร้าง Tag โดยผูกกับ workspace_id
        const newTag = await prisma.tag.create({
            data: {
                workspace_id: user.current_workspace_id, // 👈 บรรทัดนี้สำคัญมาก!
                tag_name: combinedName,
                color: color,
                description: description,
            },
        });

        // 4. ส่ง Pusher แยกตาม Workspace
        try {
            await pusherServer.trigger(`workspace-${user.current_workspace_id}-tags`, 'tag-updated', { 
                message: "New tag created" 
            });
        } catch (e) { console.error("Pusher error:", e); }

        return NextResponse.json({
            id: newTag.tag_id,
            name: name,
            color: newTag.color,
            description: newTag.description,
            emoji: emoji || "🏷️",
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating tag:", error);
        // เช็คกรณีชื่อซ้ำ (Prisma Error P2002)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Tag นี้มีอยู่แล้วในระบบ" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
    }
}