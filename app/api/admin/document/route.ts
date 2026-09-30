import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { validSession } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!validSession(request.cookies.get("codedrop_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { shareId } = await request.json();
    if (typeof shareId !== "string" || !shareId) {
      return NextResponse.json({ error: "A share ID is required." }, { status: 400 });
    }

    const client = adminSupabase();
    const { data: share, error } = await client
      .from("shares")
      .select("kind,file_path")
      .eq("id", shareId)
      .maybeSingle();

    if (error) throw error;
    if (!share || share.kind !== "document" || !share.file_path) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const { data, error: storageError } = await client.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || "share-files")
      .createSignedUrl(share.file_path, 300);

    if (storageError) throw storageError;
    return NextResponse.json(
      { url: data.signedUrl },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not unlock document." },
      { status: 500 },
    );
  }
}