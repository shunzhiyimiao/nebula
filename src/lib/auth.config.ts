import type { NextAuthConfig } from "next-auth";

// Edge-compatible config (no Prisma) — used by middleware
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const protectedPrefixes = [
        "/home", "/scan", "/notebook", "/practice",
        "/knowledge", "/report", "/settings",
      ];
      const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
};
