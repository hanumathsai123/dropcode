"use client";
import Link from "next/link";
import { useState } from "react";
export default function Support() {
  const email =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support.hanubot@gmail.com";
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [err, setErr] = useState("");
  async function submit() {
    setErr("");
    const r = await fetch("/api/recovery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, email: address, reason }),
    });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error);
      return;
    }
    setEmailSent(Boolean(j.emailSent));
    setDone(true);
  }
  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          Code<span>Drop</span>
        </Link>
      </nav>
      <div className="page card stack">
        <h1>Need Help?</h1>
        <p className="muted">
          Shares are stored until they expire or reach their access limit.
          Support admins may access them to help with recovery. If you forgot
          your code, submit a request below.
        </p>
        {done ? (
          <div className="notice success">
            {emailSent
              ? "Your request was submitted and an email alert was sent to support."
              : "Your request was saved. Email alerts are not configured yet; you can contact support directly below."}
          </div>
        ) : (
          <>
            <div>
              <label className="label">Your email</label>
              <input
                className="input"
                type="email"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Share code, if known</label>
              <input
                className="input"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))
                }
                placeholder="Enter share code, if known"
                maxLength={32}
              />
            </div>
            <div>
              <label className="label">What do you need help with?</label>
              <textarea
                className="textarea"
                style={{ minHeight: 160 }}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain your issue..."
              />
            </div>
            {err && <div className="notice error">{err}</div>}
            <button className="btn" onClick={submit}>
              Submit Recovery Request
            </button>
          </>
        )}
        <div className="notice">
          Direct support email: <a href={`mailto:${email}`}>{email}</a>
        </div>
      </div>
    </main>
  );
}
