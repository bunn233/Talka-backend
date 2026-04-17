import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";
import { dbLog } from "@/lib/dbLogger";

// 🟢 GET: ดึง Note ทั้งหมด (รวมถึงอันที่ถูก Soft Delete เป็นสีเทาๆ)
export async function GET(req, context) {
    try {
        const params = await context.params;
        const chatId = parseInt(params.id);
        if (!chatId || isNaN(chatId)) return NextResponse.json({ error: "Invalid Chat ID" }, { status: 400 });

        const notes = await prisma.note.findMany({
            where: { chat_session_id: chatId },
            orderBy: { created_at: "desc" },
        });
        return NextResponse.json({ notes });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 🟢 POST: สร้าง Note ใหม่
export async function POST(req, context) {
    try {
        const params = await context.params;
        const parsedChatId = parseInt(params.id);
        const { title, text } = await req.json();

        if (!parsedChatId || !title || !text) return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });

        const session = await getServerSession(authOptions);
        let currentUserId = 1;
        if (session?.user?.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (dbUser) currentUserId = dbUser.user_id;
        }

        const newNote = await prisma.note.create({
            data: { chat_session_id: parsedChatId, title, content: text, user_id: currentUserId },
        });

        await dbLog({
            action: "add_note",
            new_value: `${title}: ${text}`,
            chat_session_id: parsedChatId,
            user_id: currentUserId
        });

        const chatSession = await prisma.chatSession.findUnique({
            where: { chat_session_id: parsedChatId }, select: { channel: { select: { workspace_id: true } } },
        });

        if (chatSession?.channel?.workspace_id) {
            try {
                const wsChannel = `workspace-${chatSession.channel.workspace_id}`;
                await pusherServer.trigger(wsChannel, "chat-details-updated", { chatId: parsedChatId });
                await pusherServer.trigger(wsChannel, "log-updated", { chatId: parsedChatId });
            } catch (e) { console.error(e); }
        }
        return NextResponse.json({ success: true, note: newNote });
    } catch (error) {
        return NextResponse.json({ error: "บันทึก Note ไม่สำเร็จ" }, { status: 500 });
    }
}

// 🟡 PATCH: แก้ไขข้อมูล หรือทำ Soft Delete/Restore
export async function PATCH(req, context) {
    try {
        const params = await context.params;
        const parsedChatId = parseInt(params.id);
        const body = await req.json();
        const { noteId, title, text, is_deleted } = body;

        if (!noteId) return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });

        const session = await getServerSession(authOptions);
        let currentUserId = 1;
        if (session?.user?.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (dbUser) currentUserId = dbUser.user_id;
        }

        // จัดเตรียมข้อมูลที่จะอัปเดต
        let updateData = {};
        if (typeof is_deleted === "boolean") updateData.is_deleted = is_deleted;
        if (title) updateData.title = title;
        if (text) updateData.content = text;

        const updatedNote = await prisma.note.update({
            where: { note_id: parseInt(noteId) },
            data: updateData
        });

        // 🔥 เก็บ Log แยกประเภท: 1. แก้ไขข้อความ 2. ส่งลงถังขยะ 3. กู้คืน
        if (title && text) {
            await dbLog({
                action: "edit_note", 
                new_value: `${title}: ${text}`,
                chat_session_id: parsedChatId,
                user_id: currentUserId
            });
        } else if (typeof is_deleted === "boolean") {
            const actionName = is_deleted ? "trash_note" : "restore_note";
            await dbLog({
                action: actionName, 
                old_value: updatedNote.title,
                chat_session_id: parsedChatId,
                user_id: currentUserId
            });
        }

        // กระตุ้น Pusher
        const chatSession = await prisma.chatSession.findUnique({
            where: { chat_session_id: parsedChatId }, select: { channel: { select: { workspace_id: true } } },
        });
        
        if (chatSession?.channel?.workspace_id) {
            try {
                const wsChannel = `workspace-${chatSession.channel.workspace_id}`;
                await pusherServer.trigger(wsChannel, "log-updated", { chatId: parsedChatId });
            } catch (e) {}
        }

        return NextResponse.json({ success: true, note: updatedNote });
    } catch (error) {
        return NextResponse.json({ error: "แก้ไข Note ไม่สำเร็จ" }, { status: 500 });
    }
}

// 🔴 DELETE: ลบถาวร (Hard Delete)
export async function DELETE(req, context) {
    try {
        const params = await context.params;
        const parsedChatId = parseInt(params.id);
        const body = await req.json();
        const { noteId } = body;

        if (!noteId) return NextResponse.json({ error: "Missing noteId" }, { status: 400 });

        const session = await getServerSession(authOptions);
        let currentUserId = 1;
        if (session?.user?.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (dbUser) currentUserId = dbUser.user_id;
        }

        const noteToDelete = await prisma.note.findUnique({ where: { note_id: parseInt(noteId) } });

        await prisma.note.delete({ where: { note_id: parseInt(noteId) } });

        if (noteToDelete) {
            await dbLog({
                action: "delete_note", 
                old_value: noteToDelete.title,
                chat_session_id: parsedChatId,
                user_id: currentUserId
            });
        }
        const chatSession = await prisma.chatSession.findUnique({
            where: { chat_session_id: parsedChatId }, select: { channel: { select: { workspace_id: true } } }
        });

        if (chatSession?.channel?.workspace_id) {
            try {
                const wsChannel = `workspace-${chatSession.channel.workspace_id}`;
                await pusherServer.trigger(wsChannel, 'log-updated', { chatId: parsedChatId });
            } catch (e) {}
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "ลบ Note ไม่สำเร็จ" }, { status: 500 });
    }
}