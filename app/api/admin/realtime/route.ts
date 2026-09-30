import { NextRequest, NextResponse } from "next/server";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { adminSupabase } from "@/lib/supabase";
import { validSession } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!validSession(request.cookies.get("codedrop_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = adminSupabase();
  const encoder = new TextEncoder();
  let channel: RealtimeChannel | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string) => {
        if (!closed) controller.enqueue(encoder.encode(`event: ${event}\ndata: {}\n\n`));
      };

      const stop = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        if (channel) void client.removeChannel(channel);
      };

      request.signal.addEventListener("abort", stop, { once: true });
      heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 25000);

      channel = client
        .channel(`admin-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shares" },
          () => send("refresh"),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "recovery_requests" },
          () => send("refresh"),
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") send("ready");
        });
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      if (channel) void client.removeChannel(channel);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}