"use client";

import { useEffect, useState } from "react";

export default function MaintenanceControl() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/admin/maintenance", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load maintenance settings.");
        setEnabled(data.enabled);
        setMessage(data.message);
        setSavedMessage(data.message);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Could not load maintenance settings.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(nextEnabled: boolean) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update maintenance mode.");
      setEnabled(data.enabled);
      setMessage(data.message);
      setSavedMessage(data.message);
      setNotice(data.enabled ? "Maintenance notice is now live." : "DropCodes is back online.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update maintenance mode.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`maintenance-control${enabled ? " is-enabled" : ""}`}>
      <div className="maintenance-heading">
        <div>
          <span className="promotion-label">Service availability</span>
          <h2>{enabled ? "Maintenance is on" : "DropCodes is online"}</h2>
          <p>
            Public pages and share APIs show this notice. Admin access remains
            available so you can bring the service back online.
          </p>
        </div>
        <span className={`maintenance-status${enabled ? " active" : ""}`}>
          {enabled ? "Offline notice live" : "Online"}
        </span>
      </div>
      <label className="label" htmlFor="maintenance-message">Message shown to visitors</label>
      <textarea
        className="textarea maintenance-message"
        id="maintenance-message"
        maxLength={280}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="We are making a few improvements. Please check back shortly."
      />
      <div className="maintenance-footer">
        <span className="muted">{message.length}/280</span>
        <div className="row">
          <button
            className="btn secondary"
            type="button"
            disabled={loading || busy || message === savedMessage}
            onClick={() => void save(enabled)}
          >
            Save notice
          </button>
          <button
            className={enabled ? "btn maintenance-resume" : "btn maintenance-enable"}
            type="button"
            disabled={loading || busy}
            onClick={() => void save(!enabled)}
          >
            {loading ? "Loading..." : busy ? "Saving..." : enabled ? "Turn maintenance off" : "Turn maintenance on"}
          </button>
        </div>
      </div>
      {error && <div className="notice error" role="alert">{error}</div>}
      {notice && <div className="notice success" role="status">{notice}</div>}
    </section>
  );
}