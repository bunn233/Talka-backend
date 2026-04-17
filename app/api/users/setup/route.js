import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { username, workspaceName, website, company, country, phone, companySize, createWorkspace } = body;

        // 1. อัปเดตข้อมูลลงตาราง User 
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { 
                username: username, 
                is_setup: true,
                website: website || null,
                company: company || null,
                country: country || null,
                phone: phone || null,
                company_size: companySize || null
            }
        });

        // 2. ถ้าผู้ใช้กรอกสร้าง Workspace เข้ามา
        if (createWorkspace) {
            const newWorkspace = await prisma.workspace.create({
                data: {
                    name: workspaceName || "My Workspace",
                    members: {
                        create: { user_id: updatedUser.user_id, role: "Owner" } 
                    }
                }
            });

            await prisma.user.update({
                where: { user_id: updatedUser.user_id },
                data: { current_workspace_id: newWorkspace.workspace_id }
            });

            console.log(`✅ Setup Success! Workspace: ${newWorkspace.name} Created.`);
            return NextResponse.json({ success: true, workspaceId: newWorkspace.workspace_id });
        }

        // 3. กรณีข้ามการสร้าง Workspace (กด Skip)
        console.log(`✅ Setup Success! User Profile Updated (Skipped Workspace).`);
        return NextResponse.json({ success: true, message: "User setup complete without workspace" });

    } catch (error) {
        console.error("❌ Setup API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}