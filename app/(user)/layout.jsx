import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
// ⚠️ อย่าลืมแก้ path auth ให้ตรงกับโปรเจกต์พี่นะครับ
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// อิมพอร์ต ClientLayout ที่เราเพิ่งสร้างเมื่อกี้
import ClientLayout from "./ClientLayout"; 

export default async function UserLayout({ children }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/auth/login");
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { workspaces: true }
    });

    if (!dbUser) redirect("/auth/login");

    if (!dbUser.is_setup) {
        redirect("/setup");
    }

    // 🚨 เช็คว่ามีทีมหรือเปล่า ถ้าไม่มีเตะไปหน้ารอ
    const workspaceCount = dbUser.workspaces.length;
    if (workspaceCount === 0) {
        redirect("/waiting");
    } 

    // 🟢 ถ้ามีทีม ก็ให้ ClientLayout (ที่มี Sidebar) มาห่อหน้าจอไว้
    return (
        <ClientLayout>
            {children}
        </ClientLayout>
    );
}