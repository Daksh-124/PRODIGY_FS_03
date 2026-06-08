import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { loginUserAction } from "@/lib/actions";

// Local credentials validation as fallback when database is offline
function localLoginVerify(emailOrRole: string, password?: string) {
  if (emailOrRole.toLowerCase() === "admin@moonzthrift.com" && password === "admin123") {
    return {
      id: "usr-admin",
      name: "Admin Lord",
      email: "admin@moonzthrift.com",
      role: "ADMIN",
      isFirstOrder: false
    };
  }
  if (emailOrRole.toLowerCase() === "lila@moonzthrift.com" && password === "password123") {
    return {
      id: "usr-lila",
      name: "Lila Moon",
      email: "lila@moonzthrift.com",
      role: "USER",
      isFirstOrder: true
    };
  }
  return null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Try PostgreSQL DB login first
        const dbRes = await loginUserAction(credentials.email, credentials.password);
        if (dbRes.success && dbRes.user) {
          return {
            id: dbRes.user.id,
            name: dbRes.user.name,
            email: dbRes.user.email,
            role: dbRes.user.role,
            isFirstOrder: dbRes.user.isFirstOrder
          } as any;
        }

        // 2. Fallback to localStorage mock database
        if (dbRes.fallback) {
          const user = localLoginVerify(credentials.email, credentials.password);
          if (user) {
            return user as any;
          }
        }

        return null;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "MOCK_CLIENT_SECRET"
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
        token.isFirstOrder = (user as any).isFirstOrder ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).isFirstOrder = token.isFirstOrder;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET || "moonzthrift-secret-key-12345"
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
