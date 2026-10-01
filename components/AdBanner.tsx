"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: Record<string, never>[];
  }
}

type AdBannerProps = {
  enabled: boolean;
  client: string;
  slot: string;
};

export default function AdBanner({ enabled, client, slot }: AdBannerProps) {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setConsent(window.localStorage.getItem("codedrop-ad-consent") === "yes");
    } catch {
      setConsent(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !client || !slot || consent !== true) return;

    const initializeAd = () => {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({} as Record<string, never>);
      } catch {
        // AdSense can throw when no inventory is available for the slot.
      }
    };

    const existingScript = document.getElementById("codedrop-adsense-script");
    if (existingScript) {
      initializeAd();
      return;
    }

    const script = document.createElement("script");
    script.id = "codedrop-adsense-script";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.onload = initializeAd;
    document.head.appendChild(script);
  }, [client, consent, enabled, slot]);

  if (!enabled || !client || !slot) return null;

  function chooseConsent(allowed: boolean) {
    try {
      window.localStorage.setItem("codedrop-ad-consent", allowed ? "yes" : "no");
    } catch {
      // Keep the current page choice if storage is unavailable.
    }
    setConsent(allowed);
  }

  return (
    <aside className="ad-banner" aria-label="Advertisement">
      <div className="ad-banner-label">Advertisement</div>
      {consent === true ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad-consent-copy">
          <p>
            Optional ads help support DropCode. Google&apos;s ad script loads only
            if you allow it.
          </p>
          <div className="row">
            <button className="btn secondary" onClick={() => chooseConsent(true)}>
              Allow ads
            </button>
            <button className="ad-decline" onClick={() => chooseConsent(false)}>
              Keep ads off
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}