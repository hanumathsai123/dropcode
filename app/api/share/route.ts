import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { TEMPORARY_UNAVAILABLE_MESSAGE } from "@/lib/public-messages";
import {
  MAX_SHARE_FILE_BYTES,
  normalizeShareCode,
  ShareCodeError,
  uniqueShareCode,
  validateShareOptions,
} from "@/lib/shares";
export const runtime = "nodejs";
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
      if (file.size > MAX_SHARE_FILE_BYTES)
        return NextResponse.json(
          { error: "Maximum file size is 25 MB in this version." },
          { status: 400 },
        );
      kind = "document";
      expiryHours = Number(fd.get("expiryHours") || 24);
      maxViews = Number(fd.get("maxDownloads") || 1);
      validateShareOptions(expiryHours, maxViews);
      file_name = file.name;
      file_size = file.size;
      mime_type = file.type || "application/octet-stream";
      const code = await uniqueShareCode(requestedCode);
      file_path = `${code}/${file.name}`;
      const a = adminSupabase();
      const up = await a.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || "share-files")
        .upload(file_path, file, { contentType: mime_type, upsert: false });
      if (up.error)
        console.error("Share file upload failed:", up.error);
      if (up.error)
        return NextResponse.json(
          {
            error: TEMPORARY_UNAVAILABLE_MESSAGE,
          },
          { status: 503, headers: { "Retry-After": "60" } },
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
        if (error.code === "23505") {
          throw new ShareCodeError("That share code is already in use.", 409);
        }
        throw error;
      }
      return NextResponse.json({ share_code: code });
    } else {
      const b = await req.json();
      if (b.kind === "document") {
        const code = normalizeShareCode(String(b.shareCode || ""));
        const filePath = typeof b.filePath === "string" ? b.filePath : "";
        const fileName = typeof b.fileName === "string" ? b.fileName : "";
        const fileSize = Number(b.fileSize);
        const mimeType = typeof b.mimeType === "string" ? b.mimeType : "application/octet-stream";
        const expiryHours = Number(b.expiryHours);
        const maxViews = Number(b.maxDownloads);
        validateShareOptions(expiryHours, maxViews);
        if (
          !fileName ||
          fileName.length > 255 ||
          /[\r\n\0]/.test(fileName) ||
          !Number.isSafeInteger(fileSize) ||
          fileSize <= 0 ||
          fileSize > MAX_SHARE_FILE_BYTES ||
          !new RegExp(`^${code}/[0-9a-f-]{36}$`, "i").test(filePath)
        ) {
          throw new ShareCodeError("The uploaded file details are invalid.", 400);
        }

        const client = adminSupabase();
        const fileObjectName = filePath.slice(code.length + 1);
        const { data: files, error: storageError } = await client.storage
          .from(process.env.SUPABASE_STORAGE_BUCKET || "share-files")
          .list(code, { search: fileObjectName, limit: 1 });
        if (storageError) throw storageError;
        const uploadedFile = files?.find((entry) => entry.name === fileObjectName);
        if (!uploadedFile || Number(uploadedFile.metadata?.size) !== fileSize) {
          throw new ShareCodeError("The uploaded file could not be verified. Please try again.", 400);
        }

        const { error } = await client.from("shares").insert({
          share_code: code,
          kind: "document",
          file_path: filePath,
          file_name: fileName,
          file_size: fileSize,
          mime_type: mimeType,
          expires_at: new Date(Date.now() + expiryHours * 3600000).toISOString(),
          max_views: maxViews,
        });
        if (error) {
          await client.storage
            .from(process.env.SUPABASE_STORAGE_BUCKET || "share-files")
            .remove([filePath]);
          if (error.code === "23505") {
            throw new ShareCodeError("That share code is already in use.", 409);
          }
          throw error;
        }
        return NextResponse.json({ share_code: code });
      }

      content = String(b.content || "");
      title = b.title ? String(b.title) : null;
      const requestedCode = String(b.shareCode || "");
      expiryHours = Number(b.expiryHours || 24);
      maxViews = Number(b.maxViews || 1);
      validateShareOptions(expiryHours, maxViews);
      if (title && title.length > 120) {
        throw new ShareCodeError("Titles must be 120 characters or fewer.", 400);
      }
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
      const code = await uniqueShareCode(requestedCode);
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
      if (error?.code === "23505") {
        throw new ShareCodeError("That share code is already in use.", 409);
      }
      if (error) throw error;
      return NextResponse.json({ share_code: code });
    }
  } catch (e) {
    if (!(e instanceof ShareCodeError)) console.error("Share creation failed:", e);
    return NextResponse.json(
      {
        error: e instanceof ShareCodeError ? e.message : TEMPORARY_UNAVAILABLE_MESSAGE,
      },
      {
        status: e instanceof ShareCodeError ? e.status : 503,
        headers: e instanceof ShareCodeError ? undefined : { "Retry-After": "60" },
      },
    );
  }
}
