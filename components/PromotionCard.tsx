import type { PromotionView } from "@/lib/promotions";

type PromotionCardProps = {
  promotion: PromotionView;
  preview?: boolean;
};

export default function PromotionCard({
  promotion,
  preview = false,
}: PromotionCardProps) {
  return (
    <article className="promotion-card">
      <span className="promotion-label">Sponsored promotion</span>
      <div className="promotion-media">
        {promotion.media_type === "image" ? (
          <img
            src={promotion.media_url}
            alt={`${promotion.company_name}: ${promotion.title}`}
            loading="lazy"
          />
        ) : (
          <video
            src={promotion.media_url}
            controls
            muted
            playsInline
            preload="metadata"
            aria-label={`${promotion.company_name}: ${promotion.title}`}
          />
        )}
      </div>
      <div className="promotion-copy">
        <p className="promotion-company">{promotion.company_name}</p>
        <h3>{promotion.title}</h3>
        {promotion.description && <p className="promotion-description">{promotion.description}</p>}
        <div
          className={`promotion-cta ${promotion.button_alignment === "left" ? "promotion-cta-left" : "promotion-cta-right"}`}
        >
          <a
            className="btn secondary"
            href={preview ? undefined : promotion.destination_url}
            target={preview ? undefined : "_blank"}
            rel={preview ? undefined : "sponsored nofollow noopener noreferrer"}
            referrerPolicy="no-referrer"
            aria-disabled={preview || undefined}
            onClick={preview ? (event) => event.preventDefault() : undefined}
          >
            {promotion.button_text}
          </a>
        </div>
      </div>
    </article>
  );
}
