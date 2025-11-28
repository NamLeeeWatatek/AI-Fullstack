import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Allow access to test-auth page without authentication
      if (req.nextUrl.pathname.startsWith('/test-auth')) {
        return true;
      }
      // For other protected routes, require token
      return !!token;
    },
  },
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/flows/:path*",
    "/templates/:path*",
    "/inbox/:path*",
    "/settings/:path*",
    "/channels/:path*",
    "/bots/:path*",
    "/team/:path*",
    "/archives/:path*",
    "/analytics/:path*",
    "/ai-assistant/:path*",
    "/integrations/:path*",
  ],
};
