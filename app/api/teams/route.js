import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 🟢 ใช้ตัวแปร prisma จาก lib กลาง
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ดึงรายชื่อทีมเฉพาะใน Workspace ของตัวเอง (GET)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. หาข้อมูล User เพื่อเอา current_workspace_id
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { current_workspace_id: true }
        });

        if (!user?.current_workspace_id) return NextResponse.json([]);

        // 2. ดึงเฉพาะทีมที่อยู่ใน Workspace นี้
        const teams = await prisma.team.findMany({
            where: { workspace_id: user.current_workspace_id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                user_id: true,
                                username: true,
                                email: true,
                                profile_image: true // 🟢 เพิ่มรูปโปรไฟล์เผื่อใช้ใน UI
                            }
                        }
                    }
                }
            },
            orderBy: { team_id: 'desc' }
        });

        const formattedTeams = teams.map((team) => ({
            id: team.team_id,
            name: team.team_name,
            desc: team.description || "",
            members: team.members.map(m => m.user.username),
            memberDetails: team.members.map(m => ({
                id: m.user.user_id,
                name: m.user.username,
                email: m.user.email,
                image: m.user.profile_image
            })),
            platforms: Array.isArray(team.platforms) ? team.platforms : []
        }));

        return NextResponse.json(formattedTeams);
    } catch (error) {
        console.error("Error fetching teams:", error);
        return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
    }
}

// สร้างทีมใหม่ (POST)
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { current_workspace_id: true }
        });

        if (!user?.current_workspace_id) return NextResponse.json({ error: "No Workspace Found" }, { status: 400 });

        const body = await request.json();
        const { name, desc, members, platforms } = body;

        // 3. ใช้ Transaction เพื่อให้มั่นใจว่าถ้าสร้างทีมสำเร็จ สมาชิกต้องถูกเพิ่มครบ (ถ้าพังก็พังทั้งหมด)
        const result = await prisma.$transaction(async (tx) => {
            // สร้างทีมใหม่พร้อมระบุ workspace_id
            const newTeam = await tx.team.create({
                data: {
                    workspace_id: user.current_workspace_id, // 👈 บรรทัดนี้สำคัญมาก!
                    team_name: name,
                    description: desc,
                    platforms: platforms || []
                }
            });

            // เพิ่มสมาชิกในทีม (เช็คเฉพาะ User ที่อยู่ใน Workspace เดียวกันเท่านั้น)
            if (members && members.length > 0) {
                for (const memberName of members) {
                    const targetUser = await tx.workspaceMember.findFirst({
                        where: { 
                            workspace_id: user.current_workspace_id,
                            user: { username: memberName }
                        },
                        select: { user_id: true }
                    });
                    
                    if (targetUser) {
                        await tx.teamMember.create({
                            data: {
                                team_id: newTeam.team_id,
                                user_id: targetUser.user_id
                            }
                        });
                    }
                }
            }
            return newTeam;
        });

        return NextResponse.json({
            id: result.team_id,
            name: result.team_name,
            desc: result.description || "",
            members: members || [],
            platforms: result.platforms || []
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating team:", error);
        return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }
}