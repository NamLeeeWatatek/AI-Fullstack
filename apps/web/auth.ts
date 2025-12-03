import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  basePath: "/api/auth",
  providers: [
    Credentials({
      name: "Casdoor",
      credentials: {
        code: { label: "Code", type: "text" },
        state: { label: "State", type: "text" },
      },
      async authorize(credentials) {


        try {
          if (!credentials?.code) {

            return null;
          }



          // Gọi API backend để lấy token từ Casdoor
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

          const backendUrl = `${apiUrl}/auth/casdoor/callback`;



          const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: credentials.code,
              state: credentials.state,
            }),
          });



          if (!response.ok) {
            const errorText = await response.text();

            return null;
          }

          const data = await response.json();



          // Backend trả về { token, refreshToken, user, workspace, workspaces }
          // Priority: name > firstName > email
          const userName = data.user.name || data.user.firstName || data.user.email;

          const user = {
            id: String(data.user.id),
            email: data.user.email,
            name: userName,
            accessToken: data.token, // Backend trả về 'token' chứ không phải 'access_token'
            refreshToken: data.refreshToken,
            workspace: data.workspace, // Current workspace
            workspaces: data.workspaces, // All workspaces
          };


          return user;
        } catch (error) {

          if (error instanceof Error) {

          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Lưu token vào JWT khi user đăng nhập
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.id = user.id;
        token.workspace = (user as any).workspace;
        token.workspaces = (user as any).workspaces;
      }
      return token;
    },
    async session({ session, token }) {
      // Thêm token vào session để client có thể sử dụng
      if (session.user) {
        session.user.id = token.id as string;
      }
      (session as any).accessToken = token.accessToken as string;
      (session as any).refreshToken = token.refreshToken as string;
      (session as any).workspace = token.workspace;
      (session as any).workspaces = token.workspaces;
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
  debug: true,
});


