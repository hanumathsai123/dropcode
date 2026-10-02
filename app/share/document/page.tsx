"use client";
import { useState } from "react";
import Link from "next/link";
import PromotionCarousel from "@/components/PromotionCarousel";
import { TEMPORARY_UNAVAILABLE_MESSAGE } from "@/lib/public-messages";
import { uploadShareFile } from "@/lib/share-upload";
export default function DocumentShare() {
  const [file, setFile] = useState<File | null>(null);
  const [shareCode, setShareCode] = useState("");
  const [expiry, setExpiry] = useState("24");
  const [max, setMax] = useState("1");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function create() {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const r = await uploadShareFile(file, {
        shareCode,
        expiryHours: Number(expiry),
        maxDownloads: Number(max),
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.error || "Upload failed");
      setResult(j.share_code);
    } catch (e) {
      setErr(
        e instanceof TypeError
          ? TEMPORARY_UNAVAILABLE_MESSAGE
          : e instanceof Error
            ? e.message
            : "Upload failed",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          Drop<span>Codes</span>
        </Link>
        <Link href="/access" className="btn secondary">
          Enter Code
        </Link>
      </nav>
      <div className="page">
        <h1>Share a Document</h1>
        <p className="muted">
          Upload a file and create a share code. No account is required.
        </p>
        {result ? (
          <div className="stack">
            <div className="notice success">
              Your document is ready. Support admins can access stored shares to
              help with recovery requests.
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
          </div>
        ) : (
          <div className="card stack">
            <div>
              <label className="label">Choose document</label>
              <input
                className="input"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
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
              <p className="muted">
                Use 4–32 letters or numbers; hyphens are optional. Leave blank
                for a random code.
              </p>
            </div>
            {file && (
              <div className="notice">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
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
                <label className="label">Maximum downloads</label>
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
            <div className="notice">
              🔐 Your document is stored until it expires or reaches its
              download limit. Anyone with the code can open it.
              <br />
              🛡️ Support admins may access stored files to help with recovery.
            </div>
            <button className="btn" disabled={busy || !file} onClick={create}>
              {busy ? "Uploading..." : "Generate Share Code"}
            </button>
          </div>
        )}
      </div>
      <PromotionCarousel placement="sender" />
    </main>
  );
}
