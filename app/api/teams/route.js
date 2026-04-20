import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ดึงรายชื่อทีมทั้งหมด (GET)
export async function GET() {
    try {
        const teams = await prisma.team.findMany({
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                user_id: true,
                                username: true,
                                email: true,
                                role: true
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
                name: m.user.username,
                email: m.user.email,
                role: (m.user.role || "EMPLOYEE").toUpperCase()
            })),
            platforms: Array.isArray(team.platforms) ? team.platforms : (typeof team.platforms === 'string' ? JSON.parse(team.platforms) : [])
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
        const body = await request.json();
        const { name, desc, members, platforms } = body;

        const newTeam = await prisma.team.create({
            data: {
                team_name: name,
                description: desc,
                platforms: platforms || []
            }
        });

        // เพิ่มสมาชิกในทีม
        if (members && members.length > 0) {
            for (const memberName of members) {
                const user = await prisma.user.findFirst({
                    where: { username: memberName }
                });
                
                if (user) {
                    await prisma.teamMember.create({
                        data: {
                            team_id: newTeam.team_id,
                            user_id: user.user_id
                        }
                    });
                }
            }
        }

        return NextResponse.json({
            id: newTeam.team_id,
            name: newTeam.team_name,
            desc: newTeam.description || "",
            members: members || [],
            platforms: newTeam.platforms || []
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating team:", error);
        return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }
}
