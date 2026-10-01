"use client";

import { useEffect, useState } from "react";
import type { PromotionView } from "@/lib/promotions";
import PromotionCard from "@/components/PromotionCard";

type PromotionCarouselProps = { placement: "sender" | "receiver" };

export default function PromotionCarousel({ placement }: PromotionCarouselProps) {
  const [promotions, setPromotions] = useState<PromotionView[]>([]);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let mounted = true;
    const loadPromotions = async () => {
      try {
        const response = await fetch("/api/promotions", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json();
        if (mounted) setPromotions(Array.isArray(result.promotions) ? result.promotions : []);
      } catch {
        if (mounted) setPromotions([]);
      }
    };

    void loadPromotions();
    const refreshTimer = window.setInterval(loadPromotions, 15 * 1000);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, []);

  const activePromotions = promotions.filter((promotion) => {
    const startsAt = promotion.start_at ? new Date(promotion.start_at).getTime() : 0;
    const endsAt = promotion.end_at ? new Date(promotion.end_at).getTime() : Number.POSITIVE_INFINITY;
    return startsAt <= now && endsAt >= now;
  });

  useEffect(() => {
    setIndex((current) => (activePromotions.length ? current % activePromotions.length : 0));
    if (activePromotions.length < 2) return;
    const rotationTimer = window.setInterval(() => {
      setIndex((current) => (current + 1) % activePromotions.length);
    }, 20000);
    return () => window.clearInterval(rotationTimer);
  }, [activePromotions.length]);

  if (!activePromotions.length) return null;

  const previous = () =>
    setIndex((current) => (current - 1 + activePromotions.length) % activePromotions.length);
  const next = () => setIndex((current) => (current + 1) % activePromotions.length);

  return (
    <aside className="promotion-portal" aria-label="Sponsored promotions">
      <div className="promotion-portal-heading">
        <div>
          <span className="promotion-label">Sponsored</span>
          <h2>Supporters of DropCodes</h2>
        </div>
        {activePromotions.length > 1 && (
          <div className="promotion-controls">
            <button className="promotion-control" onClick={previous} aria-label="Previous promotion">
              ‹
            </button>
            <span aria-live="polite">{index + 1} / {activePromotions.length}</span>
            <button className="promotion-control" onClick={next} aria-label="Next promotion">
              ›
            </button>
          </div>
        )}
      </div>
      <PromotionCard key={`${placement}:${activePromotions[index].id}`} promotion={activePromotions[index]} />
      <span className="sr-only" aria-live="polite">
        Promotion now showing: {activePromotions[index].company_name}, {activePromotions[index].title}
      </span>
    </aside>
  );
}
