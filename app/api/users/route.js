import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ดึงรายชื่อผู้ใช้ทั้งหมด (GET)
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                user_id: true,
                username: true,
                email: true,
                role: true,
                profile_image: true
            },
            orderBy: { user_id: 'desc' }
        });

        const formattedUsers = users.map((user) => ({
            id: user.user_id,
            name: user.username,
            email: user.email,
            role: user.role || 'EMPLOYEE'
        }));

        return NextResponse.json(formattedUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
