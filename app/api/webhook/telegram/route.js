import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    const update = await req.json();

    if (update.message) {
      const tgUserId = update.message.from.id.toString();
      const firstName = update.message.from.first_name || "";
      const lastName = update.message.from.last_name || "";
      const tgName = `${firstName} ${lastName}`.trim() || "Telegram User";
      const messageId = update.message.message_id.toString();

      const channel = await prisma.channel.findFirst({
        where: { platform_name: "TELEGRAM", status: "CONNECTED" },
      });

      if (!channel) return new NextResponse("OK", { status: 200 });

      let messageType = "TEXT";
      let content = "";

      if (update.message.photo) {
        const photos = update.message.photo;
        const fileId = photos[photos.length - 1].file_id;
        content = `/api/telegram/file/${channel.channel_id}/${fileId}`;
        messageType = "IMAGE";
      } else if (update.message.text) {
        content = update.message.text;
      } else {
        return new NextResponse("OK", { status: 200 });
      }

      let customerImg = null;
      try {
        const photosRes = await fetch(
          `https://api.telegram.org/bot${channel.telegram_bot_token}/getUserProfilePhotos?user_id=${tgUserId}&limit=1`,
        );
        const photosData = await photosRes.json();
        if (photosData.ok && photosData.result.total_count > 0) {
          const avatarFileId = photosData.result.photos[0][0].file_id;
          customerImg = `/api/telegram/file/${channel.channel_id}/${avatarFileId}`;
        }
      } catch (e) {}

      let socialAccount = await prisma.customerSocialAccount.findFirst({
        where: { account_identifier: tgUserId, channel_id: channel.channel_id },
        include: { customer: true },
      });

      let customerId;
      if (!socialAccount) {
        const newCustomer = await prisma.customer.create({
          data: {
            name: tgName,
            image: customerImg,
            social_accounts: {
              create: {
                account_identifier: tgUserId,
                channel_id: channel.channel_id,
              },
            },
          },
        });
        customerId = newCustomer.customer_id;
      } else {
        customerId = socialAccount.customer_id;

        const updateData = { name: tgName };
        if (customerImg) updateData.image = customerImg;

        await prisma.customer.update({
          where: { customer_id: customerId },
          data: updateData,
        });

        if (!customerImg) customerImg = socialAccount.customer.image;
      }

      // 🚨 🔥 จุดแก้บัคที่แท้จริงอยู่ตรงนี้ครับ!!! 🔥 🚨
      let session = await prisma.chatSession.findFirst({
        where: {
          customer_id: customerId,
          channel_id: channel.channel_id,
          // ต้องหาทั้ง NEW, OPEN, PENDING ไม่งั้นมันจะสร้างห้องแชทใหม่รัวๆ
          status: { in: ["NEW", "OPEN", "PENDING"] }, 
        },
      });

      let isNewSession = false;
      if (!session) {
        await prisma.boardColumn.upsert({
          where: { column_id: "col-1" },
          update: {},
          create: { column_id: "col-1", title: "Inbox", order_index: 0 },
        });
        
        session = await prisma.chatSession.create({
          data: {
            customer_id: customerId,
            channel_id: channel.channel_id,
            board_column_id: "col-1",
            status: "NEW" // สร้างห้องเป็น NEW
          },
        });
        isNewSession = true; 
      }

      const isMsgExist = await prisma.message.findUnique({
        where: { external_id: messageId },
      });

      if (!isMsgExist) {
        const savedMessage = await prisma.message.create({
          data: {
            chat_session_id: session.chat_session_id,
            sender_type: "CUSTOMER",
            message_type: messageType, 
            content: content,
            external_id: messageId,
          },
        });

        if (channel.workspace_id) {
          if (isNewSession) {
             await pusherServer.trigger(`workspace-${channel.workspace_id}`, 'new-customer-chat', {
                 id: session.chat_session_id,
                 name: tgName,
                 profile: customerImg || "/images/default-avatar.png",
                 platform: "TELEGRAM",
                 message: content,
                 time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                 type: "CHAT"
             });
          }

          // สั่งอัปเดตข้อความ
          await pusherServer.trigger(`workspace-${channel.workspace_id}`, 'webhook-event', {
            action: "SYNC_MESSAGE",
            chatId: session.chat_session_id,
            name: tgName,
            imgUrl: customerImg,
            from: "customer",
            text: content,
            type: messageType,
            timestamp: savedMessage.created_at,
            platform: "TELEGRAM",
          });
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    return new NextResponse("Error", { status: 200 });
  }
}