import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";
import { decryptToken } from "@/lib/encryption";

export async function POST(req) {
  try {
    // 1. เช็ค Session ป้องกันคนนอกยิง API มั่ว
    const sessionAuth = await getServerSession(authOptions);
    if (!sessionAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { email: sessionAuth.user.email },
      select: { user_id: true, username: true }
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const contentType = req.headers.get("content-type") || "";
    let chatSessionId, text, workspaceId;
    const files = [];

    //  2. แยกระบบรับข้อมูล (รับ workspaceId มาด้วย)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      chatSessionId = formData.get("chatSessionId");
      text = formData.get("text");
      workspaceId = formData.get("workspaceId");

      for (const [key, value] of formData.entries()) {
        if (key === "files" && typeof value === "object" && value.name) {
          files.push(value);
        }
      }
    } else {
      const body = await req.json();
      chatSessionId = body.chatSessionId;
      text = body.text;
      workspaceId = body.workspaceId;
    }

    if (!chatSessionId || !workspaceId) {
      return NextResponse.json({ error: "Missing Parameters" }, { status: 400 });
    }

    // 3. เช็คสิทธิ์แบบ REAL-TIME ณ วินาทีที่กดส่งข้อความ
    const myWorkspace = await prisma.workspaceMember.findFirst({
      where: {
        user_id: dbUser.user_id,
        workspace_id: parseInt(workspaceId)
      }
    });

    // โดนเตะหรือโดนปลดสิทธิ์แล้วเตะกระเด็นทันที
    if (!myWorkspace) {
      return NextResponse.json({
        error: "KICKED",
        message: "สิทธิ์การเข้าถึงถูกยกเลิก หรือคุณถูกลบออกจากทีมนี้แล้ว"
      }, { status: 403 });
    }

    //  4. ดึงข้อมูลห้องแชท
    const session = await prisma.chatSession.findUnique({
      where: { chat_session_id: parseInt(chatSessionId) },
      include: {
        channel: true,
        customer: { include: { social_accounts: true } },
      },
    });

    if (!session) return NextResponse.json({ error: "Chat session not found" }, { status: 404 });

    // ถ้าห้องแชทยังเป็น NEW อยู่ ให้ปรับเป็น OPEN อัตโนมัติ เพราะแอดมินตอบกลับแล้ว
    await prisma.chatSession.update({
      where: { chat_session_id: parseInt(chatSessionId) },
      data: {
        status: "OPEN",
        ai_agent_id: null //
      }
    });

    try {
      await pusherServer.trigger(`workspace-${workspaceId}`, 'workspace-updated', {
        message: "แชทถูกเปิดอ่านและตอบกลับแล้ว"
      });
    } catch (e) { }

    const platformName = session.channel.platform_name.toUpperCase();

    let accessToken = null;

    //  2. ถอดรหัส Token ให้กลับมาเป็นของจริงก่อนยิง API!
    if (platformName === "FACEBOOK" || platformName === "INSTAGRAM") {
      accessToken = decryptToken(session.channel.fb_page_access_token);
    } else if (platformName === "LINE") {
      accessToken = decryptToken(session.channel.line_access_token);
    } else if (platformName === "TELEGRAM") {
      accessToken = decryptToken(session.channel.telegram_bot_token);
    }

    if (!accessToken) {
      return NextResponse.json({ error: "ไม่พบการเชื่อมต่อเพจสำหรับแชทนี้ (Access Token Missing)" }, { status: 400 });
    }

    const socialAccount = session.customer.social_accounts.find(
      (acc) => acc.channel_id === session.channel_id
    );

    if (!socialAccount) {
      return NextResponse.json({ error: "Customer social account not found" }, { status: 404 });
    }

    const recipientId = socialAccount.account_identifier;
    const sentMessages = [];

    const saveToDB = async (content, type) => {
      return await prisma.message.create({
        data: {
          chat_session_id: session.chat_session_id,
          content: content,
          sender_type: "AGENT",
          message_type: type,
          sender_id: dbUser.user_id
        },
      });
    };

    // ----------------------------------------------------------------------
    //  ระบบอัปโหลดรูปลงเซิร์ฟเวอร์
    // ----------------------------------------------------------------------
    const uploadedFilesInfo = [];
    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadDir, uniqueName);

        await writeFile(filePath, buffer);

        uploadedFilesInfo.push({
          file: file,
          url: `/uploads/${uniqueName}`
        });
      }
    }

    // --- ส่วนส่งข้อความไปยัง Meta ---
    if (platformName === "FACEBOOK" || platformName === "INSTAGRAM") {
      const cleanToken = accessToken.trim().replace(/[\n\r]/g, "");
      const metaBaseUrl = `https://graph.facebook.com/v21.0/me/messages?access_token=${cleanToken}`;

      if (text && text.trim() !== "") {
        const textResponse = await fetch(metaBaseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: text },
          }),
        });

        const textData = await textResponse.json();
        if (!textResponse.ok) return NextResponse.json({ error: textData.error?.message || "Failed" }, { status: 400 });
        const savedText = await saveToDB(text, "TEXT");
        sentMessages.push(savedText);
      }

      if (uploadedFilesInfo.length > 0) {
        for (const fileInfo of uploadedFilesInfo) {
          const metaFormData = new FormData();
          metaFormData.append('recipient', JSON.stringify({ id: recipientId }));
          metaFormData.append('message', JSON.stringify({
            attachment: { type: 'image', payload: { is_reusable: true } }
          }));
          metaFormData.append('filedata', fileInfo.file);

          const imgResponse = await fetch(metaBaseUrl, { method: "POST", body: metaFormData });
          if (!imgResponse.ok) continue;

          const savedImage = await saveToDB(fileInfo.url, "IMAGE");
          sentMessages.push(savedImage);
        }
      }

    } else if (platformName === "LINE") {
      const linePushUrl = "https://api.line.me/v2/bot/message/push";

      if (text && text.trim() !== "") {
        const lineResponse = await fetch(linePushUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken.trim()}`,
          },
          body: JSON.stringify({
            to: recipientId,
            messages: [{ type: "text", text: text }],
          }),
        });

        if (lineResponse.ok) {
          const savedText = await saveToDB(text, "TEXT");
          sentMessages.push(savedText);
        } else {
          console.error("LINE Text API Error:", await lineResponse.json());
        }
      }

      if (uploadedFilesInfo.length > 0) {
        const host = req.headers.get("host");
        const protocol = req.headers.get("x-forwarded-proto") || "https";
        const baseUrl = `${protocol}://${host}`;

        for (const fileInfo of uploadedFilesInfo) {
          const fullImageUrl = `${baseUrl}${fileInfo.url}`;

          const lineImgResponse = await fetch(linePushUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken.trim()}`,
            },
            body: JSON.stringify({
              to: recipientId,
              messages: [{
                type: "image",
                originalContentUrl: fullImageUrl,
                previewImageUrl: fullImageUrl
              }],
            }),
          });

          if (lineImgResponse.ok) {
            const savedImage = await saveToDB(fileInfo.url, "IMAGE");
            sentMessages.push(savedImage);
          } else {
            console.error("❌ LINE Image API Error:", await lineImgResponse.json());
          }
        }
      }

    } else if (platformName === "TELEGRAM") {
      const tgToken = accessToken.trim();
      const tgChatId = recipientId;

      if (text && text.trim() !== "") {
        const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: tgChatId, text: text }),
        });

        if (tgRes.ok) {
          const savedText = await saveToDB(text, "TEXT");
          sentMessages.push(savedText);
        }
      }

      if (uploadedFilesInfo.length > 0) {
        for (const fileInfo of uploadedFilesInfo) {
          const tgFormData = new FormData();
          tgFormData.append("chat_id", tgChatId);
          tgFormData.append("photo", fileInfo.file);

          const imgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendPhoto`, {
            method: "POST",
            body: tgFormData
          });

          if (imgRes.ok) {
            const savedImage = await saveToDB(fileInfo.url, "IMAGE");
            sentMessages.push(savedImage);
          }
        }
      }
    }

    // 2. ให้ Pusher ตะโกนบอกหน้าเว็บทุกคนในทีม
    try {
      await pusherServer.trigger(`workspace-${workspaceId}`, 'webhook-event', {
        action: "SYNC_MESSAGE",
        chatId: chatSessionId,
        text: uploadedFilesInfo.length > 0 ? uploadedFilesInfo[0].url : text,
        type: uploadedFilesInfo.length > 0 ? "IMAGE" : "TEXT",
        from: "AGENT",
        sender_type: "AGENT",
        senderName: dbUser.username || "Agent",
        platform: platformName,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Pusher Trigger Error:", e);
    }

    return NextResponse.json({ success: true, messages: sentMessages });

  } catch (error) {
    console.error("Send Message Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}