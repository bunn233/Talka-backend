import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// อัปเดตข้อมูลทีม (PATCH)
export async function PATCH(request, { params }) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        const body = await request.json();
        const { name, desc, members, platforms } = body;

        const updatedTeam = await prisma.team.update({
            where: { team_id: id },
            data: {
                team_name: name,
                description: desc,
                platforms: platforms || []
            }
        });

        // ลบสมาชิกเก่า
        await prisma.teamMember.deleteMany({
            where: { team_id: id }
        });

        // เพิ่มสมาชิกใหม่
        if (members && members.length > 0) {
            for (const memberName of members) {
                const user = await prisma.user.findFirst({
                    where: { username: memberName }
                });
                
                if (user) {
                    await prisma.teamMember.create({
                        data: {
                            team_id: id,
                            user_id: user.user_id
                        }
                    });
                }
            }
        }

        return NextResponse.json({
            id: updatedTeam.team_id,
            name: updatedTeam.team_name,
            desc: updatedTeam.description || "",
            members: members || [],
            platforms: updatedTeam.platforms || []
        });
    } catch (error) {
        console.error("Error updating team:", error);
        return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
    }
}

// ลบทีม (DELETE)
export async function DELETE(request, { params }) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);

        // ลบสมาชิกของทีม
        await prisma.teamMember.deleteMany({
            where: { team_id: id }
        });

        // ลบทีม
        await prisma.team.delete({
            where: { team_id: id }
        });

        return NextResponse.json({ success: true, message: "Team deleted successfully" });
    } catch (error) {
        console.error("Error deleting team:", error);
        return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
    }
}
