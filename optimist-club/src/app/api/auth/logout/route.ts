import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/lib/session";

// POST-only: a GET handler would let any third-party page (or an <img> tag)
// log members out drive-by, since GET navigations send the lax cookie.
export async function POST(req: NextRequest) {
  await destroySession();
  // 303 so the browser follows the redirect with a GET.
  return NextResponse.redirect(new URL("/", req.url), 303);
}

export async function GET(req: NextRequest) {
  // Don't destroy the session on GET; just send the visitor home.
  return NextResponse.redirect(new URL("/", req.url), 303);
}
