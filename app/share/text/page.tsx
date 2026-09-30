"use client";
import { useState } from "react";
import Link from "next/link";
export default function TextShare() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [expiry, setExpiry] = useState("24");
  const [max, setMax] = useState("1");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function create() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "text",
          content,
          title,
          shareCode,
          expiryHours: Number(expiry),
          maxViews: Number(max),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.error || "Could not create share");
      setResult(j.share_code);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          Code<span>Drop</span>
        </Link>
        <Link href="/access" className="btn secondary">
          Enter Code
        </Link>
      </nav>
      <div className="page">
        <h1>Create a Text Share</h1>
        <p className="muted">
          Paste your text and choose a unique 4–32 character access code, or
          leave it blank for a random code.
        </p>
        {result ? (
          <div className="stack">
            <div className="notice success">
              Your share is ready. CodeDrop support admins can access stored
              shares to help with recovery requests.
            </div>
            <div className="code">{result}</div>
            <div className="row">
              <button
                className="btn"
                onClick={() => navigator.clipboard.writeText(result)}
              >
                Copy Code
              </button>
              <Link
                className="btn secondary"
                href={`/access?code=${encodeURIComponent(result)}`}
              >
                Open Share
              </Link>
            </div>
            <div className="notice">
              Shares are stored until they expire or reach their view limit.
              Support admins may access them to help with recovery. Anyone with
              the code can open the share.
            </div>
          </div>
        ) : (
          <div className="card stack">
            <div>
              <label className="label">Title (optional)</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Project notes"
              />
            </div>
            <div>
              <label className="label">Custom share code (optional)</label>
              <input
                className="input"
                value={shareCode}
                onChange={(event) =>
                  setShareCode(event.target.value.toUpperCase())
                }
                placeholder="MY-SECRET-CODE"
                maxLength={32}
              />
              <p className="muted">Letters and numbers; hyphens are optional.</p>
            </div>
            <div>
              <label className="label">Text / Code</label>
              <textarea
                className="textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your text or code here..."
              />
            </div>
            <div className="grid">
              <div>
                <label className="label">Expiration</label>
                <select
                  className="select"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                >
                  <option value="1">1 hour</option>
                  <option value="24">24 hours</option>
                  <option value="168">7 days</option>
                </select>
              </div>
              <div>
                <label className="label">Maximum views</label>
                <select
                  className="select"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                >
                  <option value="1">1</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="1000000">Unlimited</option>
                </select>
              </div>
            </div>
            {err && <div className="notice error">{err}</div>}
            <button
              className="btn"
              disabled={busy || !content.trim()}
              onClick={create}
            >
              {busy ? "Creating..." : "Generate Share Code"}
            </button>
            <div className="notice">
              🔐 Your share is stored until it expires or reaches its view limit.
              Anyone with the code can open it.
              <br />
              🛡️ Support admins may access stored content to help with recovery.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
