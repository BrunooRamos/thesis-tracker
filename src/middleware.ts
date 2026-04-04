// Rate limiting: intentionally skipped for 3-user team.
// If needed later, add a simple in-memory counter per session.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/login";
  const isSetupPage = pathname === "/setup";
  const isApiRoute = pathname.startsWith("/api/");

  // Let all API routes handle their own auth
  if (isApiRoute) return NextResponse.next();

  if (!token && !isLoginPage && !isSetupPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && (isLoginPage || isSetupPage)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
