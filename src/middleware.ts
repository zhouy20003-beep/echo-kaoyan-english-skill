import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const PROTECTED = ["/practice", "/mock", "/dashboard", "/wrong", "/favorites", "/ask"];
const AUTH_PAGES = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (session && AUTH_PAGES.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/practice/:path*",
    "/mock/:path*",
    "/dashboard/:path*",
    "/wrong/:path*",
    "/favorites/:path*",
    "/ask/:path*",
    "/login",
    "/register",
  ],
};
