import { TEMPORARY_UNAVAILABLE_MESSAGE } from "@/lib/public-messages";

type ShareUploadOptions = {
  shareCode: string;
  expiryHours: number;
  maxDownloads: number;
};

export async function uploadShareFile(file: File, options: ShareUploadOptions) {
  const ticketResponse = await fetch("/api/share/upload-ticket", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      ...options,
    }),
  });
  const ticket = await ticketResponse.json();
  if (!ticketResponse.ok) {
    throw new Error(ticket.error || TEMPORARY_UNAVAILABLE_MESSAGE);
  }

  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!publicKey) throw new Error(TEMPORARY_UNAVAILABLE_MESSAGE);

  const uploadBody = new FormData();
  uploadBody.append("cacheControl", "3600");
  uploadBody.append("", file);
  const uploadResponse = await fetch(ticket.signedUrl, {
    method: "PUT",
    headers: {
      apikey: publicKey,
      Authorization: `Bearer ${publicKey}`,
      "x-upsert": "false",
    },
    body: uploadBody,
  });
  if (!uploadResponse.ok) throw new Error(TEMPORARY_UNAVAILABLE_MESSAGE);

  return fetch("/api/share", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind: "document",
      shareCode: ticket.shareCode,
      filePath: ticket.path,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      expiryHours: options.expiryHours,
      maxDownloads: options.maxDownloads,
    }),
  });
}