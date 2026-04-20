import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature");

    const channel = await prisma.channel.findFirst({
      where: { platform_name: "LINE" },
      orderBy: { channel_id: "desc" },
    });

    //if (!channel) return new Response("Config Error", { status: 404 });

    const hash = crypto
      .createHmac("sha256", channel.line_channel_secret)
      .update(body, "utf8")
      .digest("base64");
    if (hash !== signature)
      return new Response("Unauthorized", { status: 401 });

    const data = JSON.parse(body);
    if (!data.events) return new Response("OK", { status: 200 });

    await Promise.all(
      data.events.map(async (event) => {
        if (event.type !== "message") return;

        const lineUserId = event.source.userId;
        const messageType = event.message.type;
        let msgContent = "";

        if (messageType === "text") {
          msgContent = event.message.text;
        } else if (messageType === "image") {
          msgContent = `/api/line/image/${event.message.id}`;
        } else {
          return;
        }

        let socialAccount = await prisma.customerSocialAccount.findFirst({
          where: {
            account_identifier: lineUserId,
            channel_id: channel.channel_id,
          },
          include: { customer: true },
        });

        let currentCustomerId, customerName, customerImg;

        if (!socialAccount || !socialAccount.customer.image) {
          try {
            const profileRes = await fetch(
              `https://api.line.me/v2/bot/profile/${lineUserId}`,
              {
                headers: {
                  Authorization: `Bearer ${channel.line_access_token}`,
                },
              },
            );
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              customerName = profileData.displayName;
              customerImg = profileData.pictureUrl;
            }
          } catch (e) {}

          if (!socialAccount) {
            const newCust = await prisma.customer.create({
              data: {
                name: customerName || "LINE User",
                image: customerImg,
                social_accounts: {
                  create: {
                    channel_id: channel.channel_id,
                    account_identifier: lineUserId,
                  },
                },
              },
            });
            currentCustomerId = newCust.customer_id;
          } else {
            await prisma.customer.update({
              where: { customer_id: socialAccount.customer_id },
              data: { image: customerImg },
            });
            currentCustomerId = socialAccount.customer_id;
          }
        } else {
          currentCustomerId = socialAccount.customer_id;
          customerName = socialAccount.customer.name;
          customerImg = socialAccount.customer.image;
        }

        let chat = await prisma.chatSession.findFirst({
          where: {
            customer_id: currentCustomerId,
            channel_id: channel.channel_id,
            status: { in: ["NEW", "OPEN", "PENDING"] },
          },
        });

        //  ดักจับว่าเป็นแชทใหม่หรือไม่
        let isNewSession = false;
        if (!chat) {
          chat = await prisma.chatSession.create({
            data: {
              customer_id: currentCustomerId,
              channel_id: channel.channel_id,
              status: "NEW",
            },
          });
          isNewSession = true;
        }

        await prisma.message.create({
          data: {
            chat_session_id: chat.chat_session_id,
            content: msgContent,
            sender_type: "CUSTOMER",
            message_type: messageType.toUpperCase(),
          },
        });

        if (channel.workspace_id) {
          // 🚨 ถ่ายทอดสดเตือน New Chat ให้กระดิ่ง Sidebar!
          if (isNewSession) {
            await pusherServer.trigger(
              `workspace-${channel.workspace_id}`,
              "new-customer-chat",
              {
                id: chat.chat_session_id,
                name: customerName || "LINE User",
                profile: customerImg || "/images/default-avatar.png",
                platform: "LINE",
                message: msgContent,
                time: new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                type: "CHAT",
              },
            );
          }

          // แจ้งเตือนข้อความใหม่ปกติ
          await pusherServer.trigger(
            `workspace-${channel.workspace_id}`,
            "webhook-event",
            {
              action: "SYNC_MESSAGE",
              chatId: chat.chat_session_id,
              name: customerName,
              imgUrl: customerImg,
              text: msgContent,
              from: "customer",
              type: messageType.toUpperCase(),
              platform: "LINE",
              timestamp: new Date().toISOString(),
            },
          );
        }
      }),
    );

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response("Error", { status: 200 });
  }
}
