import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/_next", "/favicon.ico"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname) || req.nextUrl.pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("session_id");

  if (!sessionCookie) {
    console.log("⛔️ Session ist not active. Redirect to /login");
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
