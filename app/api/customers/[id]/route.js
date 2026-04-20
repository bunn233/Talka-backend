import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ดึงข้อมูลลูกค้าตามรหัส (GET)
export async function GET(request, { params }) {
    try {
        const { id } = params;
        const customer = await prisma.customer.findUnique({
            where: { customer_id: parseInt(id) },
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
            }
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const primaryChatSession = customer.chat_sessions[0];
        const avatar = customer.name.charAt(0).toUpperCase();

        // ดึง tags จาก chat session
        let tags = [];
        if (primaryChatSession?.tags && primaryChatSession.tags.length > 0) {
            tags = primaryChatSession.tags.map(tagObj => ({
                id: tagObj.tag?.tag_id,
                name: tagObj.tag?.tag_name || "",
                color: tagObj.tag?.color || "#BE7EC7"
            })).filter(tag => tag.name);
        }

        const formattedCustomer = {
            id: customer.customer_id,
            chat_session_id: primaryChatSession?.chat_session_id || null,
            name: customer.name,
            avatar: avatar,
            imgUrl: customer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || 'User')}&background=random`,
            email: customer.email || null,
            phone: customer.phone || null,
            company: customer.company || null,
            country: customer.country || null,
            tags: tags,
            status: primaryChatSession?.status || "Open",
            created_at: customer.created_at
        };

        return NextResponse.json(formattedCustomer);
    } catch (error) {
        console.error("Error fetching customer:", error);
        return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
    }
}

// อัปเดตข้อมูลลูกค้า (PUT)
export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { name, email, phone, company, country, tags, chat_session_id } = body;

        const updatedCustomer = await prisma.customer.update({
            where: { customer_id: parseInt(id) },
            data: {
                ...(name !== undefined && { name }),
                ...(email !== undefined && { email: email || null }),
                ...(phone !== undefined && { phone: phone || null }),
                ...(company !== undefined && { company: company || null }),
                ...(country !== undefined && { country: country || null })
            }
        });

        // ถ้ามีการอัปเดต tags ให้อัปเดต ChatTag
        if (tags !== undefined && chat_session_id) {
            // ลบ tags เก่า
            await prisma.chatTag.deleteMany({
                where: { chat_session_id: chat_session_id }
            });

            // เพิ่ม tags ใหม่
            if (Array.isArray(tags) && tags.length > 0) {
                const newTag = tags[0];
                const tagId = newTag.id || newTag.tag_id;
                
                if (tagId) {
                    await prisma.chatTag.create({
                        data: {
                            chat_session_id: chat_session_id,
                            tag_id: tagId
                        }
                    });
                }
            }
        }

        // ดึงข้อมูลอัปเดตแล้ว
        const updatedData = await prisma.customer.findUnique({
            where: { customer_id: parseInt(id) },
            include: {
                chat_sessions: {
                    include: {
                        channel: true,
                        tags: {
                            include: {
                                tag: true
                            }
                        }
                    },
                    orderBy: { start_time: 'desc' },
                    take: 1
                }
            }
        });

        const primaryChatSession = updatedData.chat_sessions[0];
        const avatar = updatedData.name.charAt(0).toUpperCase();
        
        let updatedTags = [];
        if (primaryChatSession?.tags && primaryChatSession.tags.length > 0) {
            updatedTags = primaryChatSession.tags.map(tagObj => ({
                id: tagObj.tag.tag_id,
                name: tagObj.tag.tag_name,
                color: tagObj.tag.color || "#BE7EC7"
            }));
        }

        return NextResponse.json({
            id: updatedData.customer_id,
            chat_session_id: primaryChatSession?.chat_session_id || null,
            name: updatedData.name,
            avatar: avatar,
            imgUrl: updatedData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedData.name)}&background=random`,
            email: updatedData.email,
            phone: updatedData.phone,
            company: updatedData.company,
            country: updatedData.country,
            tags: updatedTags,
            status: primaryChatSession?.status || "Open"
        });
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
    }
}

// ลบลูกค้า (DELETE)
export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        const customerId = parseInt(id);

        // 1. ค้นหา ChatSession ทั้งหมดของลูกค้ารายนี้ เพื่อเตรียมลบข้อมูลที่ผูกกับแชท
        const chatSessions = await prisma.chatSession.findMany({
            where: { customer_id: customerId },
            select: { chat_session_id: true }
        });
        
        const chatSessionIds = chatSessions.map(cs => cs.chat_session_id);

        // 2. ใช้ Transaction เพื่อสั่งลบข้อมูลที่เกี่ยวข้องกันทั้งหมด (ถ้าพังจะ Rollback ให้ด้วย)
        await prisma.$transaction([
            // ลบข้อมูลยิบย่อยที่ผูกกับ ChatSession ก่อน
            prisma.chatTag.deleteMany({ where: { chat_session_id: { in: chatSessionIds } } }),
            prisma.message.deleteMany({ where: { chat_session_id: { in: chatSessionIds } } }),
            prisma.note.deleteMany({ where: { chat_session_id: { in: chatSessionIds } } }),
            prisma.assignment.deleteMany({ where: { chat_session_id: { in: chatSessionIds } } }),
            prisma.activityLog.deleteMany({ where: { chat_session_id: { in: chatSessionIds } } }),
            
            // ลบ ChatSession ของลูกค้า
            prisma.chatSession.deleteMany({ where: { customer_id: customerId } }),

            // ลบข้อมูลที่ผูกตรงๆ กับ Customer
            prisma.customerSocialAccount.deleteMany({ where: { customer_id: customerId } }),
            prisma.customerTag.deleteMany({ where: { customer_id: customerId } }),

            // ลบตัว Customer เป็นอันดับสุดท้าย (ลบได้แล้วเพราะไม่มีใครผูกด้วยแล้ว)
            prisma.customer.delete({ where: { customer_id: customerId } })
        ]);

        return NextResponse.json({ message: "Customer and all related data deleted successfully" });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
    }
}
