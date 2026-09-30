import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { validSession } from "@/lib/security";
import {
  PROMOTION_MEDIA_BUCKET,
  validatePromotionMedia,
} from "@/lib/promotions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!validSession(request.cookies.get("codedrop_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const fileName = typeof body.fileName === "string" ? body.fileName : "";
    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    const size = Number(body.size);
    const validation = validatePromotionMedia(fileName, contentType, size);
    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const path = `${randomUUID()}.${validation.extension}`;
    const { data, error } = await adminSupabase()
      .storage.from(PROMOTION_MEDIA_BUCKET)
      .createSignedUploadUrl(path, { upsert: false });
    if (error) throw error;

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
      mediaType: validation.mediaType,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not authorize media upload." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!validSession(request.cookies.get("codedrop_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const path = typeof body.path === "string" ? body.path : "";
    if (!/^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|mp4|webm|mov)$/i.test(path)) {
      return NextResponse.json({ error: "Invalid promotion media path." }, { status: 400 });
    }

    const client = adminSupabase();
    const { data: referenced, error: lookupError } = await client
      .from("promotions")
      .select("id")
      .eq("media_path", path)
      .limit(1);
    if (lookupError) throw lookupError;
    if (referenced?.length) {
      return NextResponse.json({ error: "Media is already used by a promotion." }, { status: 409 });
    }

    const { error } = await client.storage
      .from(PROMOTION_MEDIA_BUCKET)
      .remove([path]);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not remove unused media." },
      { status: 500 },
    );
  }
}
