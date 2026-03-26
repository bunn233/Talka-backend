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

          if (!user) return null;

          const isMatch = await bcrypt.compare(credentials.password, user.password);
          
          if (isMatch) {
            return { 
                id: user.user_id.toString(), 
                name: user.username, 
                email: user.email, 
                role: user.role,
                image: user.profile_image?.startsWith("http") ? user.profile_image : null 
            };
          }
          return null;
        } catch (error) {
          console.error("NextAuth error:", error);
          return null;
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            await prisma.user.create({
              data: {
                username: user.name,
                email: user.email,
                password: "",
                profile_image: user.image,
                role: "USER",
                online_status: "ONLINE",
                is_setup: false
              },
            });
          } else if (!existingUser.profile_image && user.image) {
            await prisma.user.update({
              where: { email: user.email },
              data: { profile_image: user.image }
            });
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