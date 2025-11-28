import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Casdoor",
      credentials: {
        code: { label: "Code", type: "text" },
        state: { label: "State", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.code) {
            console.error("NextAuth: No code provided");
            return null;
          }

          console.log("NextAuth: Calling backend with code:", credentials.code.substring(0, 10) + "...");

          // Gọi API backend để lấy token từ Casdoor
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/casdoor/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                code: credentials.code,
                state: credentials.state,
              }),
            }
          );

          console.log("NextAuth: Backend response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("NextAuth: Backend error:", errorText);
            return null;
          }

          const data = await response.json();
          console.log("NextAuth: Login successful for user:", data.user?.email);

          // Trả về user object với token
          return {
            id: String(data.user.id),
            email: data.user.email,
            name: data.user.name,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          };
        } catch (error) {
          console.error("NextAuth: Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Lưu token vào JWT khi user đăng nhập
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Thêm token vào session để client có thể sử dụng
      session.user.id = token.id as string;
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
