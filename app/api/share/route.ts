import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { randomCode } from "@/lib/security";
export const runtime = "nodejs";
class ShareCodeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function uniqueCode(preferredCode?: string) {
  if (preferredCode) {
    const code = preferredCode.trim().toUpperCase();
    if (!/^(?=.{4,32}$)[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)) {
      throw new ShareCodeError(
        "Custom codes must be 4–32 letters or numbers; hyphens may separate groups.",
        400,
      );
    }
    const { data, error } = await adminSupabase()
      .from("shares")
      .select("id")
      .eq("share_code", code)
      .maybeSingle();
    if (error) throw error;
    if (data) throw new ShareCodeError("That share code is already in use.", 409);
    return code;
  }

  for (let i = 0; i < 8; i++) {
    const c = randomCode();
    const { data, error } = await adminSupabase()
      .from("shares")
      .select("id")
      .eq("share_code", c)
      .maybeSingle();
    if (error) throw error;
    if (!data) return c;
  }
  throw Error("Could not generate unique code");
}
export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    let kind = "text",
      content = "",
      title = null,
      file_path = null,
      file_name = null,
      file_size = null,
      mime_type = null,
      expiryHours = 24,
      maxViews = 1;
    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const file = fd.get("file");
      const requestedCode = String(fd.get("shareCode") || "");
      if (!(file instanceof File))
        return NextResponse.json(
          { error: "File is required" },
          { status: 400 },
        );
      if (file.size > 25 * 1024 * 1024)
        return NextResponse.json(
          { error: "Maximum file size is 25 MB in this version." },
          { status: 400 },
        );
      kind = "document";
      expiryHours = Number(fd.get("expiryHours") || 24);
      maxViews = Number(fd.get("maxDownloads") || 1);
      file_name = file.name;
      file_size = file.size;
      mime_type = file.type || "application/octet-stream";
      const code = await uniqueCode(requestedCode);
      file_path = `${code}/${file.name}`;
      const a = adminSupabase();
      const up = await a.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || "share-files")
        .upload(file_path, file, { contentType: mime_type, upsert: false });
      if (up.error)
        return NextResponse.json(
          {
            error: `Storage upload failed: ${up.error.message}. Create the share-files bucket first.`,
          },
          { status: 500 },
        );
      const { error } = await adminSupabase()
        .from("shares")
        .insert({
          share_code: code,
          kind,
          title,
          file_path,
          file_name,
          file_size,
          mime_type,
          expires_at: new Date(
            Date.now() + expiryHours * 3600000,
          ).toISOString(),
          max_views: maxViews,
        });
      if (error) {
        await a.storage
          .from(process.env.SUPABASE_STORAGE_BUCKET || "share-files")
          .remove([file_path]);
        throw error;
      }
      return NextResponse.json({ share_code: code });
    } else {
      const b = await req.json();
      content = String(b.content || "");
      title = b.title ? String(b.title) : null;
      const requestedCode = String(b.shareCode || "");
      expiryHours = Number(b.expiryHours || 24);
      maxViews = Number(b.maxViews || 1);
      if (!content.trim())
        return NextResponse.json(
          { error: "Text is required" },
          { status: 400 },
        );
      if (content.length > 500000)
        return NextResponse.json(
          { error: "Text is too large." },
          { status: 400 },
        );
      const code = await uniqueCode(requestedCode);
      const { error } = await adminSupabase()
        .from("shares")
        .insert({
          share_code: code,
          kind: "text",
          title,
          encrypted_content: content,
          expires_at: new Date(
            Date.now() + expiryHours * 3600000,
          ).toISOString(),
          max_views: maxViews,
        });
      if (error) throw error;
      return NextResponse.json({ share_code: code });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: e instanceof ShareCodeError ? e.status : 500 },
    );
  }
}
