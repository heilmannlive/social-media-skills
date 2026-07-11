import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/lib/session";

async function logout(req: NextRequest): Promise<NextResponse> {
  await destroySession();
  // 303 so the browser follows with a GET regardless of the original method.
  return NextResponse.redirect(new URL("/", req.url), 303);
}

export async function POST(req: NextRequest) {
  return logout(req);
}

// Defensive: also allow GET (e.g. a manually typed URL) with the same behavior.
export async function GET(req: NextRequest) {
  return logout(req);
}
