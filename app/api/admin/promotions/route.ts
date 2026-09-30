import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { validSession } from "@/lib/security";
import {
  PROMOTION_MEDIA_BUCKET,
  promotionMediaTypeFromPath,
} from "@/lib/promotions";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return validSession(request.cookies.get("codedrop_admin")?.value);
}

function isPromotionsTableMissing(error: unknown) {
  const databaseError = error as { code?: string; message?: string };
  return (
    databaseError?.code === "PGRST205" ||
    (databaseError?.message?.includes("promotions") === true &&
      databaseError.message.includes("schema cache"))
  );
}

function promotionErrorResponse(error: unknown, fallback: string) {
  const missingTable = isPromotionsTableMissing(error);
  const message = missingTable
    ? "Promotions database is not initialized. Apply supabase/migrations/002_promotions.sql in the Supabase SQL Editor."
    : error instanceof Error
      ? error.message
      : fallback;
  return NextResponse.json({ error: message }, { status: missingTable ? 503 : 500 });
}

function validatePayload(body: Record<string, unknown>, fallbackPath?: string) {
  const companyName = typeof body.company_name === "string" ? body.company_name.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const buttonText = typeof body.button_text === "string" ? body.button_text.trim() : "Learn More";
  const buttonAlignment = body.button_alignment === undefined ? "right" : body.button_alignment;
  const mediaPath = typeof body.media_path === "string" && body.media_path
    ? body.media_path
    : fallbackPath || "";
  const mediaType = promotionMediaTypeFromPath(mediaPath);
  const startAt = typeof body.start_at === "string" ? new Date(body.start_at) : new Date(Number.NaN);
  const endAt = typeof body.end_at === "string" ? new Date(body.end_at) : new Date(Number.NaN);
  let destinationUrl = "";

  try {
    const parsed = new URL(String(body.destination_url || ""));
    if (parsed.protocol === "https:") destinationUrl = parsed.toString();
  } catch {
    destinationUrl = "";
  }

  if (companyName.length < 1 || companyName.length > 120) {
    return { error: "Company name must be 1–120 characters." };
  }
  if (title.length < 1 || title.length > 160) {
    return { error: "Promotion title must be 1–160 characters." };
  }
  if (description.length > 1000) {
    return { error: "Description must be 1,000 characters or fewer." };
  }
  if (!destinationUrl) {
    return { error: "Enter a valid HTTPS destination URL." };
  }
  if (buttonText.length < 1 || buttonText.length > 60) {
    return { error: "Button text must be 1–60 characters." };
  }
  if (buttonAlignment !== "left" && buttonAlignment !== "right") {
    return { error: "Choose left or right button alignment." };
  }
  if (!mediaType || !/^[0-9a-f-]{36}\.[a-z0-9]+$/i.test(mediaPath)) {
    return { error: "Upload one valid image or video before saving." };
  }
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) {
    return { error: "Choose valid promotion start and end dates." };
  }
  if (endAt <= startAt) {
    return { error: "The promotion end date must be after its start date." };
  }
  if (typeof body.enabled !== "boolean") {
    return { error: "Choose whether the promotion is enabled." };
  }

  return {
    value: {
      company_name: companyName,
      title,
      description,
      destination_url: destinationUrl,
      button_text: buttonText,
      button_alignment: buttonAlignment,
      media_path: mediaPath,
      media_type: mediaType,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      enabled: body.enabled,
    },
  };
}

async function withMediaUrl<T extends { media_path: string }>(rows: T[]) {
  const client = adminSupabase();
  return Promise.all(rows.map(async (row) => {
    const { data, error } = await client.storage
      .from(PROMOTION_MEDIA_BUCKET)
      .createSignedUrl(row.media_path, 60 * 60);
    return { ...row, media_url: error ? "" : data.signedUrl };
  }));
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await adminSupabase()
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return promotionErrorResponse(error, "Could not load promotions.");

  return NextResponse.json(
    { promotions: await withMediaUrl(data || []) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = validatePayload(body);
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const client = adminSupabase();
    const { error: mediaError } = await client.storage
      .from(PROMOTION_MEDIA_BUCKET)
      .createSignedUrl(validated.value.media_path, 60);
    if (mediaError) throw mediaError;

    const { data, error } = await client
      .from("promotions")
      .insert(validated.value)
      .select("*")
      .single();
    if (error) {
      await client.storage.from(PROMOTION_MEDIA_BUCKET).remove([validated.value.media_path]);
      throw error;
    }

    return NextResponse.json({ promotion: (await withMediaUrl([data]))[0] }, { status: 201 });
  } catch (error) {
    return promotionErrorResponse(error, "Could not create promotion.");
  }
}

export async function PUT(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "Promotion ID is required." }, { status: 400 });

    const client = adminSupabase();
    const { data: current, error: lookupError } = await client
      .from("promotions")
      .select("media_path")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!current) return NextResponse.json({ error: "Promotion not found." }, { status: 404 });

    const validated = validatePayload(body, current.media_path);
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    if (validated.value.media_path !== current.media_path) {
      const { error: mediaError } = await client.storage
        .from(PROMOTION_MEDIA_BUCKET)
        .createSignedUrl(validated.value.media_path, 60);
      if (mediaError) throw mediaError;
    }

    const { data, error } = await client
      .from("promotions")
      .update(validated.value)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    if (validated.value.media_path !== current.media_path) {
      await client.storage.from(PROMOTION_MEDIA_BUCKET).remove([current.media_path]);
    }

    return NextResponse.json({ promotion: (await withMediaUrl([data]))[0] });
  } catch (error) {
    return promotionErrorResponse(error, "Could not update promotion.");
  }
}

export async function DELETE(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "Promotion ID is required." }, { status: 400 });

    const client = adminSupabase();
    const { data: promotion, error: lookupError } = await client
      .from("promotions")
      .select("media_path")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!promotion) return NextResponse.json({ error: "Promotion not found." }, { status: 404 });

    const { error } = await client.from("promotions").delete().eq("id", id);
    if (error) throw error;
    const { error: storageError } = await client.storage
      .from(PROMOTION_MEDIA_BUCKET)
      .remove([promotion.media_path]);
    if (storageError) throw storageError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return promotionErrorResponse(error, "Could not delete promotion.");
  }
}
