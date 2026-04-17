import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { pusherServer } from "@/lib/pusher";

const prisma = new PrismaClient();

// ดึงข้อมูล Tag ทั้งหมด (GET)
export async function GET() {
    try {
        const tags = await prisma.tag.findMany({
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
        const body = await request.json();
        const { name, color, description, emoji } = body;

        const combinedName = emoji ? `${emoji} ${name}` : name;

        const newTag = await prisma.tag.create({
            data: {
                tag_name: combinedName,
                color: color,
                description: description,
            },
        });

        try {
            await pusherServer.trigger('global-tags', 'tag-updated', { message: "New tag created" });
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
        return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
    }
}