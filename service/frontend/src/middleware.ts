import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    console.log("🔹 Middleware wurde ausgeführt!", req.nextUrl.pathname); // ✅ Prüft, ob sie aufgerufen wird
    
    const sessionCookie = req.cookies.get("session_id"); // ✅ Holt das Session-Cookie

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url)); // 🔹 Falls keine Session existiert → Weiterleitung zu /login
  }

  return NextResponse.next(); // ✅ Erlaubt die Anfrage
}

// 🔹 Middleware nur für bestimmte Routen aktivieren
export const config = {
  matcher: ["/", "/new", "/issues", "/dashboard/:path*", "/profile/:path*"], // ✅ Schützt alle Unterseiten
};
