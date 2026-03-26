import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// 🔥 1. บังคับไม่ให้ Next.js ทำ Caching ในหน้านี้เด็ดขาด (สำคัญสำหรับ SSE)
export const dynamic = "force-dynamic";

// 🔥 2. ใช้ globalThis เพื่อป้องกันไม่ให้ clients หายไปตอน Hot Reload ในโหมด Dev
// (หมายเหตุ: วิธีนี้ใช้ได้ผลดีถ้ารันบนเซิร์ฟเวอร์แบบ VPS / Custom Node Server
// แต่ถ้า Deploy บน Vercel ต้องพิจารณาใช้ Redis Pub/Sub หรือ Pusher แทน)
const globalClients = globalThis.sseClients || [];
if (process.env.NODE_ENV !== "production") {
  globalThis.sseClients = globalClients;
}

function broadcast(data) {
  globalClients.forEach((client, index) => {
    try {
      // 🛠️ แก้ตรงนี้: ส่งแค่ data ไปตรงๆ ไม่ต้องใส่ `data: ... \n\n` ซ้อน
      client.write(data); 
    } catch (error) {
      console.error(`❌ ขัดข้องตอนส่งข้อมูลให้ Client ที่ ${index}`, error);
      globalClients.splice(index, 1);
    }
  });
}

// =========================
// 🔥 SSE (Realtime)
// =========================
/**
 * @swagger
 * /api/line/webhook:
 *   get:
 *     tags:
 *       - Webhooks
 *     summary: Subscribe to real-time chat updates via SSE
 *     description: Establish a Server-Sent Events (SSE) connection to receive real-time chat updates. Use query parameter stream=true to enable streaming.
 *     parameters:
 *       - name: stream
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["true"]
 *         description: Must be set to "true" to enable streaming
 *     responses:
 *       200:
 *         description: SSE stream established successfully
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: "text/event-stream"
 *           Cache-Control:
 *             schema:
 *               type: string
 *               example: "no-cache, no-transform"
 *           Connection:
 *             schema:
 *               type: string
 *               example: "keep-alive"
 *       404:
 *         description: Stream parameter not set to true
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("stream") !== "true") {
    return new Response("Not Found", { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const push = (data) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      const clientInfo = { write: push };
      globalClients.push(clientInfo);

      req.signal.addEventListener("abort", () => {
        const index = globalClients.indexOf(clientInfo);
        if (index !== -1) {
          globalClients.splice(index, 1);
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform", // เพิ่ม no-transform ป้องกัน proxy ปรับแต่งข้อมูล
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*", // อนุญาตให้ Frontend ยิงมารับได้
    },
  });
}

// =========================
// 🔥 WEBHOOK (LINE)
// =========================
/**
 * @swagger
 * /api/line/webhook:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: LINE webhook endpoint
 *     description: Receive webhook events from LINE platform. Validates requests using LINE signature verification.
 *     security:
 *       - LineSignature: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               events:
 *                 type: array
 *                 description: Array of LINE events
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [message, follow, unfollow, join, leave, postback, beacon]
 *                       description: Event type
 *                     source:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           description: LINE user ID
 *                     message:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           enum: [text, image, video, audio, file, location, template, flex]
 *                           description: Message type
 *                         text:
 *                           type: string
 *                           description: Message text (for text messages)
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         description: Invalid or missing LINE signature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature");

    const hash = crypto
      .createHmac("sha256", process.env.LINE_CHANNEL_SECRET)
      .update(body)
      .digest("base64");

    if (hash !== signature) {
      console.error("❌ Invalid signature");
      return new Response("Unauthorized", { status: 401 }); 
    }

    const data = JSON.parse(body);

    await Promise.all(
      data.events.map(async (event) => {
        if (event.type !== "message" || event.message.type !== "text") return;

        const lineUserId = event.source.userId;
        const text = event.message.text;

        let platform = await prisma.platform.findFirst({
          where: { platform_name: "LINE" }
        });
        if (!platform) {
          platform = await prisma.platform.create({ data: { platform_name: "LINE" } });
        }

        let socialAccount = await prisma.customerSocialAccount.findFirst({
          where: { 
            account_identifier: lineUserId,
            platform_id: platform.platform_id
          },
          include: { customer: true } // 🛠️ ดึงข้อมูล Customer มาด้วยเพื่อเอาชื่อ
        });

        let currentCustomerId;
        let customerName = "LINE User"; // ชื่อตั้งต้น

        // 3. ถ้าเป็นลูกค้าใหม่
        if (!socialAccount) {
          // 🛠️ ยิง API ไปถาม LINE ว่า User ID นี้ชื่ออะไร
          try {
            const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
              headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` }
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              customerName = profileData.displayName; // ได้ชื่อจริงมาแล้ว!
            }
          } catch (error) {
            console.error("❌ ดึงชื่อโปรไฟล์ LINE ไม่สำเร็จ:", error);
          }

          const newCustomer = await prisma.customer.create({
            data: {
              name: customerName, // บันทึกชื่อจริงลง Database
              social_accounts: {
                create: {
                  platform_id: platform.platform_id,
                  account_identifier: lineUserId
                }
              }
            }
          });
          currentCustomerId = newCustomer.customer_id;
        } else {
          // ถ้าเป็นลูกค้าเก่า ใช้ชื่อเดิมจาก Database
          currentCustomerId = socialAccount.customer_id;
          if (socialAccount.customer) {
            customerName = socialAccount.customer.name;
          }
        }

        let chat = await prisma.chatSession.findFirst({
          where: { 
            customer_id: currentCustomerId,
            platform_id: platform.platform_id,
            status: { in: ["OPEN", "PENDING"] }
          },
        });

        if (!chat) {
          chat = await prisma.chatSession.create({
            data: {
              customer_id: currentCustomerId,
              platform_id: platform.platform_id,
              status: "OPEN",
            },
          });
        }

        await prisma.message.create({
          data: {
            chat_session_id: chat.chat_session_id,
            content: text,
            sender_type: "CUSTOMER",
            message_type: "TEXT",
          },
        });

        // 6. 🔥 ส่งชื่อไปให้ Frontend ด้วย
        broadcast({
          chatId: chat.chat_session_id,
          text,
          from: "CUSTOMER",
          customerName: customerName, // 🛠️ เพิ่มบรรทัดนี้
          timestamp: new Date().toISOString(),
        });
      })
    );

    return new Response(JSON.stringify({ message: "OK" }), { status: 200 });

  } catch (err) {
    console.error("🔥 WEBHOOK ERROR:", err);
    return new Response(JSON.stringify({ message: "fail but ok" }), {
      status: 200,
    });
  }
}