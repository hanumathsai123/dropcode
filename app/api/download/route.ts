import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { TEMPORARY_UNAVAILABLE_MESSAGE } from "@/lib/public-messages";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const shareId = request.nextUrl.searchParams.get("share");
  if (!shareId) {
    return new NextResponse("This download link is invalid.", { status: 400 });
  }

  try {
    const client = adminSupabase();
    const { data: share, error } = await client
      .from("shares")
      .select("kind,file_path,file_name,expires_at,max_views,download_count")
      .eq("id", shareId)
      .maybeSingle();
    if (error) throw error;
    if (!share || share.kind !== "document" || !share.file_path) {
      return new NextResponse("Document not found.", { status: 404 });
    }
    if (new Date(share.expires_at) <= new Date()) {
      return new NextResponse("This share has expired.", { status: 410 });
    }
    if (share.download_count >= share.max_views) {
      return new NextResponse("This share has reached its download limit.", { status: 410 });
    }

    const { data: signedUrl, error: storageError } = await client.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || "share-files")
      .createSignedUrl(share.file_path, 60, { download: share.file_name || true });
    if (storageError) throw storageError;

    const { data: updated, error: updateError } = await client
      .from("shares")
      .update({ download_count: share.download_count + 1 })
      .eq("id", shareId)
      .eq("download_count", share.download_count)
      .select("id")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) {
      return new NextResponse(
        "This download was requested at the same time elsewhere. Please try again.",
        { status: 409 },
      );
    }

    return NextResponse.redirect(signedUrl.signedUrl, {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("File download failed:", error);
    return new NextResponse(TEMPORARY_UNAVAILABLE_MESSAGE, {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": "60",
      },
    });
  }
}