export const PROMOTION_MEDIA_BUCKET = "promotion-media";
export const MAX_PROMOTION_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_PROMOTION_VIDEO_BYTES = 50 * 1024 * 1024;

export type PromotionMediaType = "image" | "video";

export type PromotionView = {
  id: string;
  company_name: string;
  title: string;
  description: string;
  destination_url: string;
  button_text: string;
  button_alignment: "left" | "right";
  media_type: PromotionMediaType;
  media_url: string;
  start_at?: string;
  end_at?: string;
};

const mediaTypesByExtension: Record<
  string,
  { type: string; mediaType: PromotionMediaType }
> = {
  jpg: { type: "image/jpeg", mediaType: "image" },
  jpeg: { type: "image/jpeg", mediaType: "image" },
  png: { type: "image/png", mediaType: "image" },
  webp: { type: "image/webp", mediaType: "image" },
  mp4: { type: "video/mp4", mediaType: "video" },
  webm: { type: "video/webm", mediaType: "video" },
  mov: { type: "video/quicktime", mediaType: "video" },
};

export function validatePromotionMedia(
  fileName: string,
  contentType: string,
  size: number,
) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const media = mediaTypesByExtension[extension];
  if (!media || media.type !== contentType.toLowerCase()) {
    return { error: "Choose a JPG, JPEG, PNG, WEBP, MP4, WEBM, or MOV file." };
  }

  const sizeLimit = media.mediaType === "image"
    ? MAX_PROMOTION_IMAGE_BYTES
    : MAX_PROMOTION_VIDEO_BYTES;
  if (!Number.isFinite(size) || size <= 0 || size > sizeLimit) {
    return {
      error:
        media.mediaType === "image"
          ? "Images must be 10 MB or smaller."
          : "Videos must be 50 MB or smaller.",
    };
  }

  return { extension, mediaType: media.mediaType };
}

export function promotionMediaTypeFromPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase() || "";
  return mediaTypesByExtension[extension]?.mediaType || null;
}
