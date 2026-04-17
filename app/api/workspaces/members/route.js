import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 1. หาว่าเราอยู่ Workspace ไหน
        const myWorkspace = await prisma.workspaceMember.findFirst({
            where: { user_id: dbUser.user_id },
            select: { workspace_id: true }
        });

        if (!myWorkspace) {
            return NextResponse.json([]); 
        }

        // 2. ดึงสมาชิกทุกคนที่อยู่ใน Workspace เดียวกับเรา
        const members = await prisma.workspaceMember.findMany({
            where: { workspace_id: myWorkspace.workspace_id },
            include: {
                user: {
                    select: {
                        user_id: true,
                        username: true,
                        email: true,
                        profile_image: true
                    }
                }
            }
        });

        // 3. แปลงข้อมูลส่งกลับไปให้หน้าเว็บโชว์สวยๆ
        const formattedMembers = members.map(m => ({
            id: m.user.user_id,
            name: m.user.username || "Unnamed User",
            email: m.user.email,
            role: m.role || "Employee",
            profile_image: m.user.profile_image
        }));

        return NextResponse.json(formattedMembers);

    } catch (error) {
        console.error("❌ Get Workspace Members Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}