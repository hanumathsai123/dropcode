"use client";

import { useEffect, useState } from "react";

export default function MaintenanceControl() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [launchAnnouncementEnabled, setLaunchAnnouncementEnabled] = useState(false);
  const [launchAnnouncementMessage, setLaunchAnnouncementMessage] = useState("");
  const [savedLaunchAnnouncementMessage, setSavedLaunchAnnouncementMessage] = useState("");
  const [configurationReady, setConfigurationReady] = useState(false);
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
        setLaunchAnnouncementEnabled(data.launchAnnouncementEnabled);
        setLaunchAnnouncementMessage(data.launchAnnouncementMessage);
        setSavedLaunchAnnouncementMessage(data.launchAnnouncementMessage);
        setConfigurationReady(true);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Could not load maintenance settings.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(nextEnabled = enabled, nextLaunchAnnouncementEnabled = launchAnnouncementEnabled) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enabled: nextEnabled,
          message,
          launchAnnouncementEnabled: nextLaunchAnnouncementEnabled,
          launchAnnouncementMessage,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update maintenance mode.");
      setEnabled(data.enabled);
      setMessage(data.message);
      setSavedMessage(data.message);
      setLaunchAnnouncementEnabled(data.launchAnnouncementEnabled);
      setLaunchAnnouncementMessage(data.launchAnnouncementMessage);
      setSavedLaunchAnnouncementMessage(data.launchAnnouncementMessage);
      setNotice(
        nextEnabled !== enabled
          ? nextEnabled ? "Maintenance notice is now live." : "DropCodes is back online."
          : nextLaunchAnnouncementEnabled !== launchAnnouncementEnabled
            ? nextLaunchAnnouncementEnabled
              ? "The launch announcement is now visible."
              : "The launch announcement is hidden."
            : "Visitor messages saved.",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update maintenance mode.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`maintenance-control${enabled ? " is-enabled" : ""}${!loading && !configurationReady ? " is-error" : ""}`}>
      <div className="maintenance-heading">
        <div>
          <span className="promotion-label">Service availability</span>
          <h2>
            {loading
              ? "Checking service status..."
              : !configurationReady
                ? "Setup required"
                : enabled
                  ? "Maintenance is on"
                  : "DropCodes is online"}
          </h2>
          <p>
            Public pages and share APIs show this notice. Admin access remains
            available so you can bring the service back online.
          </p>
        </div>
        <span className={`maintenance-status${enabled || (!loading && !configurationReady) ? " active" : ""}`}>
          {loading ? "Checking" : !configurationReady ? "Needs setup" : enabled ? "Offline notice live" : "Online"}
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
            disabled={loading || busy || !configurationReady || (message === savedMessage && launchAnnouncementMessage === savedLaunchAnnouncementMessage)}
            onClick={() => void save()}
          >
            Save notice
          </button>
          <button
            className={enabled ? "btn maintenance-resume" : "btn maintenance-enable"}
            type="button"
            disabled={loading || busy || !configurationReady}
            onClick={() => void save(!enabled)}
          >
            {loading ? "Loading..." : busy ? "Saving..." : enabled ? "Turn maintenance off" : "Turn maintenance on"}
          </button>
        </div>
      </div>
      <div className="launch-settings">
        <div className="launch-settings-heading">
          <div>
            <span className="promotion-label">Launch day</span>
            <h3>Happy birthday, DropCodes!</h3>
            <p>Show or hide the launch announcement for visitors.</p>
          </div>
          <span className={`maintenance-status${launchAnnouncementEnabled ? " launch-active" : ""}`}>
            {launchAnnouncementEnabled ? "Visible to visitors" : "Hidden"}
          </span>
        </div>
        <label className="label" htmlFor="launch-announcement-message">Launch announcement</label>
        <textarea
          className="textarea maintenance-message"
          id="launch-announcement-message"
          maxLength={280}
          value={launchAnnouncementMessage}
          onChange={(event) => setLaunchAnnouncementMessage(event.target.value)}
          placeholder="DropCodes is live! We launched today. Welcome aboard."
        />
        <div className="maintenance-footer">
          <span className="muted">{launchAnnouncementMessage.length}/280</span>
          <button
            className={launchAnnouncementEnabled ? "btn secondary" : "btn launch-enable"}
            type="button"
            disabled={loading || busy || !configurationReady}
            onClick={() => void save(enabled, !launchAnnouncementEnabled)}
          >
            {loading ? "Loading..." : busy ? "Saving..." : launchAnnouncementEnabled ? "Hide launch announcement" : "Show launch announcement"}
          </button>
        </div>
      </div>
      {error && <div className="notice error" role="alert">{error}</div>}
      {notice && <div className="notice success" role="status">{notice}</div>}
    </section>
  );
}