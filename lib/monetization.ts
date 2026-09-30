export type AffiliateRecommendation = {
  name: string;
  url: string;
  description?: string;
  affiliate: boolean;
};

function safeHttpsUrl(value: string | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function readAffiliateRecommendations(): AffiliateRecommendation[] {
  const raw = process.env.NEXT_PUBLIC_AFFILIATE_TOOLS;
  if (!raw) return [];

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    return value.flatMap((item): AffiliateRecommendation[] => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Record<string, unknown>;
      const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
      const url = safeHttpsUrl(
        typeof candidate.url === "string" ? candidate.url.trim() : undefined,
      );
      if (!name || !url) return [];

      const description =
        typeof candidate.description === "string"
          ? candidate.description.trim().slice(0, 180)
          : undefined;

      return [
        {
          name: name.slice(0, 80),
          url,
          description,
          affiliate: candidate.affiliate === true,
        },
      ];
    });
  } catch {
    return [];
  }
}

export function getMonetizationConfig() {
  const adClient = process.env.NEXT_PUBLIC_AD_CLIENT?.trim() || "";
  const adSlot = process.env.NEXT_PUBLIC_AD_SLOT?.trim() || "";
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  const sponsorName = process.env.NEXT_PUBLIC_SPONSOR_NAME?.trim() || "";
  const sponsorUrl = safeHttpsUrl(process.env.NEXT_PUBLIC_SPONSOR_URL?.trim());
  const sponsorMessage =
    process.env.NEXT_PUBLIC_SPONSOR_MESSAGE?.trim().slice(0, 180) || "";
  const sponsorEnabled = process.env.NEXT_PUBLIC_SPONSOR_ENABLED === "true";
  const supportUrl = safeHttpsUrl(process.env.NEXT_PUBLIC_SUPPORT_URL?.trim());
  const partnershipEmail = process.env.NEXT_PUBLIC_PARTNERSHIP_EMAIL?.trim() || "";

  return {
    ads: {
      enabled: adsEnabled,
      configured:
        adsEnabled &&
        /^ca-pub-[0-9]+$/.test(adClient) &&
        /^[0-9]+$/.test(adSlot),
      client: adClient,
      slot: adSlot,
    },
    sponsor: {
      enabled: sponsorEnabled && Boolean(sponsorName && sponsorUrl),
      name: sponsorName.slice(0, 80),
      url: sponsorUrl,
      message: sponsorMessage,
    },
    supportUrl,
    partnershipEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partnershipEmail)
      ? partnershipEmail
      : "",
    affiliates: readAffiliateRecommendations(),
  };
}

export function getMonetizationStatus() {
  const config = getMonetizationConfig();
  return {
    advertisementsConfigured: config.ads.configured,
    advertisementsEnabled: config.ads.enabled,
    sponsorConfigured: config.sponsor.enabled,
    supportUrlConfigured: Boolean(config.supportUrl),
    partnershipContactConfigured: Boolean(config.partnershipEmail),
    affiliateCount: config.affiliates.length,
  };
}