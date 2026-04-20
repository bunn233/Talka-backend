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

        // ถ้ามีการสร้าง Workspace ด้วย ให้ใช้ $transaction เพื่อความชัวร์ (ถ้าพังก็พังคู่ ไม่ปล่อยให้ข้อมูลแหว่ง)
        if (createWorkspace) {
            const result = await prisma.$transaction(async (tx) => {
                // 1. อัปเดตข้อมูล User
                const updatedUser = await tx.user.update({
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

                // 2. สร้าง Workspace และผูก User เป็น OWNER
                const newWorkspace = await tx.workspace.create({
                    data: {
                        name: workspaceName || "My Workspace",
                        members: {
                            // 🟢 แก้ไขเป็น "OWNER" ตัวพิมพ์ใหญ่ให้ตรงกับ Schema แล้ว
                            create: { user_id: updatedUser.user_id, role: "OWNER" } 
                        }
                    }
                });

                // 3. อัปเดต current_workspace_id กลับไปที่ User
                await tx.user.update({
                    where: { user_id: updatedUser.user_id },
                    data: { current_workspace_id: newWorkspace.workspace_id }
                });

                return newWorkspace;
            });

            console.log(`✅ Setup Success! Workspace: ${result.name} Created.`);
            return NextResponse.json({ success: true, workspaceId: result.workspace_id });
        } 
        
        // ----------------------------------------------------
        // กรณีข้ามการสร้าง Workspace (กด Skip)
        // ----------------------------------------------------
        await prisma.user.update({
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

        console.log(`✅ Setup Success! User Profile Updated (Skipped Workspace).`);
        return NextResponse.json({ success: true, message: "User setup complete without workspace" });

    } catch (error) {
        console.error("❌ Setup API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}