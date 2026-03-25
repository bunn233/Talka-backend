import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-line-signature");

    const hash = crypto
      .createHmac("SHA256", process.env.CHANNEL_SECRET)
      .update(rawBody)
      .digest("base64");

    if (hash !== signature) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = JSON.parse(rawBody);

    for (let event of body.events) {
      if (event.type === "message" && event.message.type === "text") {
        const lineUserId = event.source.userId;

        // 🔥 Customer
        let customer = await prisma.customer.findUnique({
          where: { external_id: lineUserId },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              external_id: lineUserId,
              name: "LINE User",
            },
          });
        }

        // 🔥 Session
        let session = await prisma.chatSession.findFirst({
          where: {
            customer_id: customer.customer_id,
            status: "OPEN",
          },
        });

        if (!session) {
          session = await prisma.chatSession.create({
            data: {
              customer_id: customer.customer_id,
              platform_id: 1,
            },
          });
        }

        // 🔥 Message
        await prisma.message.create({
          data: {
            chat_session_id: session.chat_session_id,
            sender_type: "CUSTOMER",
            message_type: "TEXT",
            content: event.message.text,
          },
        });
      }
    }

    return new Response("OK");
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
}