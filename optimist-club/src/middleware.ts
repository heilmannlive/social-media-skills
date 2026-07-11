import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Edge-safe session check: verifies the cookie signature only. Fine-grained
// role/status checks happen server-side in requireUser()/requireRole().

const COOKIE_NAME = "oc_session";

function getSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === "change-me-to-a-long-random-string") {
    // Fail closed in production: with no real secret, no token is trusted.
    // (session.ts throws in the same situation, so pages fail closed too.)
    if (process.env.NODE_ENV === "production") return null;
    return new TextEncoder().encode("optimist-club-dev-secret-do-not-use-in-prod");
  }
  return new TextEncoder().encode(secret);
}

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/members",
  "/events",
  "/announcements",
  "/account",
  "/membership",
  "/notifications",
  "/admin",
  "/pending",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const secret = getSecret();
  if (token && secret) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      // fall through to redirect
    }
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js|api).*)"],
};
