import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { TEMPORARY_UNAVAILABLE_MESSAGE } from "@/lib/public-messages";
import {
  MAX_SHARE_FILE_BYTES,
  ShareCodeError,
  uniqueShareCode,
  validateShareOptions,
} from "@/lib/shares";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    const fileSize = Number(body.fileSize);
    const expiryHours = Number(body.expiryHours);
    const maxDownloads = Number(body.maxDownloads);
    if (!fileName || fileName.length > 255 || /[\r\n\0]/.test(fileName)) {
      throw new ShareCodeError("Choose a valid file name.", 400);
    }
    if (!Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > MAX_SHARE_FILE_BYTES) {
      throw new ShareCodeError("Files must be 25 MB or smaller.", 400);
    }
    validateShareOptions(expiryHours, maxDownloads);

    const shareCode = await uniqueShareCode(
      typeof body.shareCode === "string" ? body.shareCode : "",
    );
    const path = `${shareCode}/${randomUUID()}`;
    const { data, error } = await adminSupabase()
      .storage.from(process.env.SUPABASE_STORAGE_BUCKET || "share-files")
      .createSignedUploadUrl(path, { upsert: false });
    if (error) throw error;

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
      shareCode,
    });
  } catch (error) {
    if (error instanceof ShareCodeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Share upload authorization failed:", error);
    return NextResponse.json(
      { error: TEMPORARY_UNAVAILABLE_MESSAGE },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }
}