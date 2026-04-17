import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json([], { status: 401 }); 
        }

        // 🔥 1. รับ ID ทีมมาจาก URL (หน้าเว็บต้องส่ง ?wsId=... มาด้วย)
        const { searchParams } = new URL(req.url);
        const wsId = searchParams.get("wsId");

        if (!wsId) {
            return NextResponse.json([], { status: 400 }); // ถ้าไม่ส่งทีมมา ไม่ให้ข้อมูล
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { user_id: true }
        });

        if (!dbUser) return NextResponse.json([], { status: 404 });

        // 🔥 2. เช็คก่อนว่ายูสเซอร์คนนี้ มีสิทธิ์ในทีมที่ขอข้อมูลมาจริงๆ ใช่ไหม?
        const myWorkspace = await prisma.workspaceMember.findFirst({
            where: { 
                user_id: dbUser.user_id,
                workspace_id: parseInt(wsId) 
            }
        });

        if (!myWorkspace) {
            return NextResponse.json([], { status: 403 }); 
        }

        // 🔥 3. ดึง "ทุกช่องทาง" ของทีมนี้มาแสดง (ลบเงื่อนไข status ออกแล้ว)
        const channels = await prisma.channel.findMany({
            where: {
                workspace_id: parseInt(wsId)
            },
            orderBy: { created_at: "desc" }
        });

        return NextResponse.json(channels, { 
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        });
    } catch (error) {
        console.error("Error fetching channels:", error);
        return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
    }
}