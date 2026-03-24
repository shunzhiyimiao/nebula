import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED = ["/home", "/scan", "/notebook", "/practice", "/knowledge", "/report", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
    const isSecure = request.url.startsWith("https://");

    // NextAuth v5 changed cookie name from "next-auth.session-token" to "authjs.session-token"
    const cookieName = isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const token = await getToken({ req: request, secret, cookieName });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest).*)"],
};
