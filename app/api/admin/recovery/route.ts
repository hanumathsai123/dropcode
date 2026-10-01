import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { validSession } from "@/lib/security";
export async function POST(req: NextRequest) {
  if (!validSession(req.cookies.get("codedrop_admin")?.value))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (typeof body.id !== "string" || !body.id)
    return NextResponse.json({ error: "A request ID is required." }, { status: 400 });

  const admin = adminSupabase();
  const { data: recovery, error: lookupError } = await admin
    .from("recovery_requests")
    .select("id,requester_email,status")
    .eq("id", body.id)
    .maybeSingle();
  if (lookupError)
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!recovery)
    return NextResponse.json({ error: "Recovery request not found." }, { status: 404 });
  if (recovery.status === "resolved")
    return NextResponse.json({ ok: true, alreadyResolved: true, emailSent: false });

  const { error } = await admin
    .from("recovery_requests")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", body.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  let emailSent = false;
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.RESEND_FROM_EMAIL;
  if (apiKey && sender) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [recovery.requester_email],
        reply_to: process.env.SUPPORT_EMAIL || "support.hanubot@gmail.com",
        subject: "Your DropCodes support request was resolved",
        text: "Your DropCodes recovery request has been marked as successfully resolved by support. If you still need help, reply to this email.",
      }),
      cache: "no-store",
    });
    emailSent = response.ok;
    if (!response.ok) {
      console.error(`Recovery email delivery failed with status ${response.status}.`);
    }
  }

  return NextResponse.json({ ok: true, emailSent });
}
