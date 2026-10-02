import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { TEMPORARY_UNAVAILABLE_MESSAGE } from "@/lib/public-messages";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const email = String(b.email || "").trim();
    const reason = String(b.reason || "").trim();
    const code = String(b.code || "")
      .trim()
      .toUpperCase();
    if (!email || !reason)
      return NextResponse.json(
        { error: "Email and reason are required." },
        { status: 400 },
      );
    const s = adminSupabase();
    let share_id = null;
    if (code) {
      const { data } = await s
        .from("shares")
        .select("id")
        .eq("share_code", code)
        .maybeSingle();
      share_id = data?.id || null;
    }
    const { error } = await s
      .from("recovery_requests")
      .insert({
        share_id,
        share_code: code || null,
        requester_email: email,
        reason,
      });
    if (error) throw error;

    let emailSent = false;
    const resendApiKey = process.env.RESEND_API_KEY;
    const sender = process.env.RESEND_FROM_EMAIL;
    if (resendApiKey && sender) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [process.env.SUPPORT_EMAIL || "support.hanubot@gmail.com"],
          reply_to: email,
          subject: "New DropCodes support request",
          text: [
            "A new DropCodes recovery request was submitted.",
            `Requester: ${email}`,
            `Share code: ${code || "not provided"}`,
            `Reason: ${reason}`,
          ].join("\n\n"),
        }),
        cache: "no-store",
      });
      emailSent = response.ok;
      if (!response.ok) {
        console.error(`Support email delivery failed with status ${response.status}.`);
      }
    }

    return NextResponse.json({ ok: true, emailSent });
  } catch (e) {
    console.error("Recovery request failed:", e);
    return NextResponse.json(
      { error: TEMPORARY_UNAVAILABLE_MESSAGE },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }
}
