import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { validSession } from "@/lib/security";
import { getMonetizationStatus } from "@/lib/monetization";
export async function GET(req: NextRequest) {
  if (!validSession(req.cookies.get("codedrop_admin")?.value))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const a = adminSupabase();
    const [
      { data: shares, error: sharesError },
      { data: recovery, error: recoveryError },
    ] = await Promise.all([
      a.from("shares").select("*").order("created_at", { ascending: false }),
      a
        .from("recovery_requests")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    if (sharesError) throw sharesError;
    if (recoveryError) throw recoveryError;

    const now = Date.now();
    const stats = {
      total: shares?.length || 0,
      active:
        shares?.filter((x) => new Date(x.expires_at).getTime() > now).length || 0,
      expired:
        shares?.filter((x) => new Date(x.expires_at).getTime() <= now).length || 0,
      text: shares?.filter((x) => x.kind === "text").length || 0,
      documents: shares?.filter((x) => x.kind === "document").length || 0,
    };
    return NextResponse.json(
      {
        stats,
        shares: shares || [],
        recovery: recovery || [],
        monetization: getMonetizationStatus(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load admin overview." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
