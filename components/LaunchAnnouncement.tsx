"use client";

import { useEffect, useState } from "react";

export default function LaunchAnnouncement() {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    fetch("/api/site-status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (data.enabled && typeof data.message === "string") {
          setAnnouncement(data.message);
        }
      })
      .catch(() => undefined);
  }, []);

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