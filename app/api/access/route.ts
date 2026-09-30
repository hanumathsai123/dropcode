import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
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
      .eq("id", data.id);
    if (up.error) throw up.error;
    let download_url = null;
    if (data.kind === "document" && data.file_path) {
      const { data: urlData, error: urlError } = await s.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || "share-files")
        .createSignedUrl(data.file_path, 300);
      if (urlError) throw urlError;
      download_url = urlData.signedUrl;
    }
    return NextResponse.json({
      id: data.id,
      kind: data.kind,
      title: data.title,
      content: data.encrypted_content,
      file_name: data.file_name,
      file_size: data.file_size,
      mime_type: data.mime_type,
      expires_at: data.expires_at,
      download_url,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
