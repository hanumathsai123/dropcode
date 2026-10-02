import "server-only";
import { adminSupabase } from "@/lib/supabase";
import { randomCode } from "@/lib/security";

export const MAX_SHARE_FILE_BYTES = 25 * 1024 * 1024;
const SHARE_CODE_PATTERN = /^(?=.{4,32}$)[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

export class ShareCodeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function validateShareOptions(expiryHours: number, maxViews: number) {
  if (![1, 24, 168].includes(expiryHours)) {
    throw new ShareCodeError("Choose a valid expiration period.", 400);
  }
  if (![1, 5, 10, 1000000].includes(maxViews)) {
    throw new ShareCodeError("Choose a valid access limit.", 400);
  }
}

export function normalizeShareCode(value: string) {
  const code = value.trim().toUpperCase();
  if (!SHARE_CODE_PATTERN.test(code)) {
    throw new ShareCodeError(
      "Custom codes must be 4–32 letters or numbers; hyphens may separate groups.",
      400,
    );
  }
  return code;
}

export async function uniqueShareCode(preferredCode?: string) {
  if (preferredCode) {
    const code = normalizeShareCode(preferredCode);
    const { data, error } = await adminSupabase()
      .from("shares")
      .select("id")
      .eq("share_code", code)
      .maybeSingle();
    if (error) throw error;
    if (data) throw new ShareCodeError("That share code is already in use.", 409);
    return code;
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode();
    const { data, error } = await adminSupabase()
      .from("shares")
      .select("id")
      .eq("share_code", code)
      .maybeSingle();
    if (error) throw error;
    if (!data) return code;
  }
  throw new Error("Could not generate unique code");
}