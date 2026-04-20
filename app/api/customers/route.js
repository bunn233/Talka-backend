import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ดึงรายชื่อลูกค้าทั้งหมด (GET)
export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                social_accounts: {
                    include: {
                        channel: true
                    }
                },
                chat_sessions: {
                    include: {
                        channel: true,
                        tags: {
                            include: {
                                tag: true
                            }
                        },
                        messages: {
                            orderBy: { created_at: 'desc' },
                            take: 1
                        }
                    },
                    orderBy: { start_time: 'desc' }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const formattedCustomers = customers.map((customer) => {
            // ดึงข้อมูล channel จาก social account หรือ chat session
            let channel = "Direct";
            let platform = "direct";
            const primarySocialAccount = customer.social_accounts[0];
            const primaryChatSession = customer.chat_sessions[0];

            if (primarySocialAccount?.channel) {
                channel = primarySocialAccount.channel.platform_name || "Direct";
                platform = primarySocialAccount.channel.platform_name?.toLowerCase() || "direct";
            } else if (primaryChatSession?.channel) {
                channel = primaryChatSession.channel.platform_name || "Direct";
                platform = primaryChatSession.channel.platform_name?.toLowerCase() || "direct";
            }

            // ดึง last message
            let lastMessage = "";
            if (primaryChatSession?.messages && primaryChatSession.messages.length > 0) {
                lastMessage = primaryChatSession.messages[0].content || "";
            }

            // ดึง tags จาก chat session (ChatTag) ไม่ใช่จาก customer
            let tags = [];
            if (primaryChatSession?.tags && primaryChatSession.tags.length > 0) {
                tags = primaryChatSession.tags.map(tagObj => ({
                    id: tagObj.tag?.tag_id,
                    name: tagObj.tag?.tag_name || "",
                    color: tagObj.tag?.color || "#BE7EC7"
                })).filter(tag => tag.name);
            }

            // สร้าง avatar จากตัวอักษรแรก
            const nameForAvatar = customer.name || "Unknown";
            const avatar = nameForAvatar.charAt(0).toUpperCase();

            return {
                id: customer.customer_id,
                chat_session_id: primaryChatSession?.chat_session_id || null,
                name: customer.name,
                avatar: avatar,
                imgUrl: customer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || 'User')}&background=random`,
                channel: channel,
                platform: platform,
                email: customer.email || null,
                phone: customer.phone || null,
                company: customer.company || null,
                country: customer.country || null,
                tags: tags,
                status: primaryChatSession?.status || "Open",
                lastMessage: lastMessage,
                time: primaryChatSession?.start_time 
                    ? new Date(primaryChatSession.start_time).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })
                    : "",
                created_at: customer.created_at
            };
        });

        return NextResponse.json(formattedCustomers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}

// เพิ่มลูกค้าใหม่ (POST)
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, phone, company, country, channel, tags } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // ค้นหา channel ID ถ้ามี channel name
        let channelId = null;
        if (channel) {
            const foundChannel = await prisma.channel.findFirst({
                where: { platform_name: channel }
            });
            channelId = foundChannel?.channel_id;
        }

        // ถ้าไม่มี channel ให้สร้าง default channel
        if (!channelId) {
            const defaultChannel = await prisma.channel.findFirst({
                where: { platform_name: "Direct" }
            });
            channelId = defaultChannel?.channel_id || 1;
        }

        const newCustomer = await prisma.customer.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                company: company || null,
                country: country || null
            }
        });

        // สร้าง ChatSession สำหรับ customer
        const chatSession = await prisma.chatSession.create({
            data: {
                customer_id: newCustomer.customer_id,
                channel_id: channelId,
                status: "OPEN",
                start_time: new Date()
            }
        });

        // เพิ่ม tags ถ้ามี
        let assignedTagInfo = null;
        if (tags && Array.isArray(tags) && tags.length > 0) {
            const tagData = tags[0];
            // รองรับทั้งฟอร์แมต .id และ .tag_id
            const tagId = tagData.id || tagData.tag_id; 
            const parsedId = parseInt(tagId);
            
            // 👈 เช็คว่าแปลงเป็นตัวเลขได้จริง ป้องกัน Prisma พัง (NaN Error)
            if (!isNaN(parsedId)) { 
                const foundTag = await prisma.tag.findUnique({
                    where: { tag_id: parsedId }
                });
                
                if (foundTag) {
                    await prisma.chatTag.create({
                        data: {
                            chat_session_id: chatSession.chat_session_id,
                            tag_id: foundTag.tag_id
                        }
                    });
                    
                    // เตรียมข้อมูลส่งกลับไปให้หน้าเว็บแสดงผลสีและชื่อทันที
                    assignedTagInfo = {
                        id: foundTag.tag_id,
                        name: foundTag.tag_name,
                        color: foundTag.color || "#BE7EC7"
                    };
                }
            }
        }

        const avatar = name.charAt(0).toUpperCase();

        return NextResponse.json({
            // ... ข้อมูลเดิมที่ส่งกลับ ...
            id: newCustomer.customer_id,
            chat_session_id: chatSession.chat_session_id,
            name: newCustomer.name,
            avatar: avatar,
            imgUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            email: newCustomer.email,
            phone: newCustomer.phone,
            company: newCustomer.company,
            country: newCustomer.country,
            // 👈 ส่งข้อมูล Tag กลับไปแสดงผล
            tags: assignedTagInfo ? [assignedTagInfo] : [], 
            status: "Open",
            channel: channel || "Direct",
            platform: channel?.toLowerCase() || "direct"
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating customer:", error);
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
}
