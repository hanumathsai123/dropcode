import { NextResponse } from "next/server";
import { signSession } from "@/lib/security";
export async function POST(req: Request) {
  const { code } = await req.json();
  if (!process.env.CODEDROP_ADMIN_CODE)
    return NextResponse.json(
      { error: "Admin access is not configured." },
      { status: 500 },
    );
  if (!process.env.ADMIN_SESSION_SECRET)
    return NextResponse.json(
      { error: "Admin session signing is not configured." },
      { status: 500 },
    );
  if (String(code) !== process.env.CODEDROP_ADMIN_CODE)
    return NextResponse.json({ error: "Invalid admin code." }, { status: 401 });
  const r = NextResponse.json({ ok: true });
  r.cookies.set("codedrop_admin", signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return r;
}
