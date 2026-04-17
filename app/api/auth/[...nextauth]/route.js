import NextAuth from "next-auth"; 
import CredentialsImport from "next-auth/providers/credentials";
import GoogleImport from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CredentialsProvider = CredentialsImport.default || CredentialsImport;
const GoogleProvider = GoogleImport.default || GoogleImport;

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          // 1. เช็คว่ามีผู้ใช้นี้ไหม
          if (!user) {
            throw new Error("ไม่พบผู้ใช้งานนี้ในระบบ");
          }

          //  2. เช็คว่ายืนยันอีเมล (OTP) หรือยัง? ถ้ายังให้เตะออก
          if (!user.emailVerified) {
            throw new Error("กรุณายืนยันอีเมล (OTP) ก่อนเข้าสู่ระบบ");
          }

          // 3. เช็ครหัสผ่าน
          const isMatch = await bcrypt.compare(credentials.password, user.password);
          
          if (!isMatch) {
            throw new Error("รหัสผ่านไม่ถูกต้อง");
          }

          // ถ้าผ่านหมด ส่งข้อมูลกลับไปทำ Session
          return { 
              id: user.user_id.toString(), 
              name: user.username, 
              email: user.email, 
              role: user.role,
              image: user.profile_image?.startsWith("http") ? user.profile_image : null 
          };
        } catch (error) {
          console.error("NextAuth error:", error);
          // ส่ง error message กลับไปให้หน้าบ้านแสดงผล
          throw new Error(error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      // 🔥 จัดการตอน Login ผ่าน Google
      if (account.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // สร้างบัญชีใหม่และถือว่า "ยืนยันอีเมลแล้ว" ทันที
            await prisma.user.create({
              data: {
                username: user.name,
                email: user.email,
                password: "",
                profile_image: user.image,
                role: "USER",
                online_status: "ONLINE",
                is_setup: false,
                emailVerified: new Date()
              },
            });
          } else {
            // ถ้ามีบัญชีอยู่แล้ว อัปเดตรูปหรือยืนยันอีเมลให้ (เผื่อกรณีเคยสมัครแบบกรอกรหัสไว้แต่ลืมใส่ OTP)
            const updates = {};
            if (!existingUser.profile_image && user.image) updates.profile_image = user.image;
            if (!existingUser.emailVerified) updates.emailVerified = new Date();

            if (Object.keys(updates).length > 0) {
              await prisma.user.update({
                where: { email: user.email },
                data: updates
              });
            }
          }
          return true;
        } catch (error) {
          console.error("Error during Google SignIn:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        token.name = session.name;
        token.is_setup = session.is_setup;
      }

      if (user) { 
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        
        if (dbUser) {
          token.id = dbUser.user_id;
          token.role = dbUser.role;
          token.isGoogle = (dbUser.password === "");
          token.is_setup = dbUser.is_setup;

          const img = dbUser.profile_image || user.image;
          if (img && img.startsWith("http")) {
             token.picture = img;
          } else {
             token.picture = null;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.image = token.picture;
        session.user.isGoogle = token.isGoogle;
        session.user.is_setup = token.is_setup;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
  }
};

const handler = typeof NextAuth === 'function' ? NextAuth(authOptions) : NextAuth.default(authOptions);

export { handler as GET, handler as POST };