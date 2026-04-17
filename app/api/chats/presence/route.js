import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
    try {
        const body = await req.json();
        const { workspaceId, chatId, user, action } = body;

        await pusherServer.trigger(`workspace-${workspaceId}`, 'viewer-activity', {
            chatId: chatId,
            user: user,
            action: action
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Presence Error:", e);
        return NextResponse.json({ error: "Presence error" }, { status: 500 });
    }
}