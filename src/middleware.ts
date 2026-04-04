import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoginPage = req.nextUrl.pathname === "/login";
  const isSetupPage = req.nextUrl.pathname === "/setup";
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");

  if (isAuthRoute) return NextResponse.next();

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
