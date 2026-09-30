import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { PROMOTION_MEDIA_BUCKET } from "@/lib/promotions";

export const dynamic = "force-dynamic";

function promotionsTableMissing(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" ||
    (error.message?.includes("promotions") === true &&
      error.message.includes("schema cache"))
  );
}

export async function GET() {
  try {
    const now = new Date().toISOString();
    const client = adminSupabase();
    const { data, error } = await client
      .from("promotions")
      .select(
        "id,company_name,title,description,destination_url,button_text,button_alignment,media_path,media_type,start_at,end_at",
      )
      .eq("enabled", true)
      .lte("start_at", now)
      .gte("end_at", now)
      .order("created_at", { ascending: false });

    if (error) {
      if (promotionsTableMissing(error)) {
        return NextResponse.json(
          { promotions: [] },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      throw error;
    }

    const promotions = await Promise.all(
      (data || []).map(async (promotion) => {
        const { data: media, error: mediaError } = await client.storage
          .from(PROMOTION_MEDIA_BUCKET)
          .createSignedUrl(promotion.media_path, 60 * 60);
        if (mediaError) throw mediaError;

        return {
          id: promotion.id,
          company_name: promotion.company_name,
          title: promotion.title,
          description: promotion.description,
          destination_url: promotion.destination_url,
          button_text: promotion.button_text,
          button_alignment: promotion.button_alignment,
          media_type: promotion.media_type,
          media_url: media.signedUrl,
          start_at: promotion.start_at,
          end_at: promotion.end_at,
        };
      }),
    );

    return NextResponse.json(
      { promotions },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load promotions." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
