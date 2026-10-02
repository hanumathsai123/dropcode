import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { TEMPORARY_UNAVAILABLE_MESSAGE } from "@/lib/public-messages";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    const clean = String(code || "")
      .trim()
      .toUpperCase();
    if (!/^(?=.{4,32}$)[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(clean))
      return NextResponse.json(
        { error: "Enter a 4–32 character code using letters, numbers, and optional hyphens." },
        { status: 400 },
      );
    const s = adminSupabase();
    const { data, error } = await s
      .from("shares")
      .select("*")
      .eq("share_code", clean)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      return NextResponse.json(
        { error: "Share not found. Check the code and try again." },
        { status: 404 },
      );
    if (new Date(data.expires_at) <= new Date())
      return NextResponse.json(
        { error: "This share has expired." },
        { status: 410 },
      );
    if (data.view_count >= data.max_views)
      return NextResponse.json(
        { error: "This share has reached its access limit." },
        { status: 410 },
      );
    const nextCount = data.view_count + 1;
    const up = await s
      .from("shares")
      .update({
        view_count: nextCount,
        last_accessed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("view_count", data.view_count)
      .select("id")
      .maybeSingle();
    if (up.error) throw up.error;
    if (!up.data) {
      return NextResponse.json(
        { error: "This share was opened at the same time elsewhere. Please try again." },
        { status: 409 },
      );
    }
    const download_url =
      data.kind === "document" && data.file_path
        ? `/api/download?share=${encodeURIComponent(data.id)}`
        : null;
    return NextResponse.json(
      {
        id: data.id,
        kind: data.kind,
        title: data.title,
        content: data.encrypted_content,
        file_name: data.file_name,
        file_size: data.file_size,
        mime_type: data.mime_type,
        expires_at: data.expires_at,
        download_url,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("Share access failed:", e);
    return NextResponse.json(
      { error: TEMPORARY_UNAVAILABLE_MESSAGE },
      { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" } },
    );
  }
}
