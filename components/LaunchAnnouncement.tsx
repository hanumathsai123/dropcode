"use client";

import { useEffect, useState } from "react";
import { TEMPORARY_UNAVAILABLE_MESSAGE } from "@/lib/public-messages";

export default function LaunchAnnouncement() {
  const [announcement, setAnnouncement] = useState("");
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  useEffect(() => {
    fetch("/api/site-status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          setServiceUnavailable(true);
          return;
        }
        const data = await response.json();
        if (data.available === false) {
          setServiceUnavailable(true);
          return;
        }
        if (data.enabled && typeof data.message === "string") {
          setAnnouncement(data.message);
        }
      })
      .catch(() => setServiceUnavailable(true));
  }, []);

  if (serviceUnavailable) {
    return (
      <aside className="notice error service-unavailable" role="status" aria-live="polite">
        {TEMPORARY_UNAVAILABLE_MESSAGE}
      </aside>
    );
  }

  if (!announcement) return null;

  return (
    <aside className="launch-announcement" role="status" aria-live="polite">
      <span className="launch-announcement-mark" aria-hidden="true">DC</span>
      <span className="launch-announcement-title">Happy birthday, DropCodes!</span>
      <span className="launch-announcement-copy">{announcement}</span>
      <span className="launch-announcement-spark" aria-hidden="true">01 · LIVE</span>
    </aside>
  );
}