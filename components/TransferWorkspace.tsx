"use client";

import Link from "next/link";
import { useState } from "react";

type ShareMode = "text" | "file";

export default function TransferWorkspace() {
  const [mode, setMode] = useState<ShareMode>("text");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [shareCode, setShareCode] = useState("");
  const [expiry, setExpiry] = useState("24");
  const [maxViews, setMaxViews] = useState("1");
  const [receiveCode, setReceiveCode] = useState("");
  const [resultCode, setResultCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function createShare() {
    setError("");
    setCopied(false);
    if (mode === "text" && !content.trim()) {
      setError("Add some text before creating a share.");
      return;
    }
    if (mode === "file" && !file) {
      setError("Choose a file before creating a share.");
      return;
    }
    if (file && file.size > 25 * 1024 * 1024) {
      setError("Files must be 25 MB or smaller.");
      return;
    }

    setBusy(true);
    try {
      const response =
        mode === "text"
          ? await fetch("/api/share", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                kind: "text",
                content,
                title,
                shareCode,
                expiryHours: Number(expiry),
                maxViews: Number(maxViews),
              }),
            })
          : await uploadFile();
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create share.");
      setResultCode(data.share_code);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create share.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile() {
    const form = new FormData();
    form.append("file", file as File);
    form.append("shareCode", shareCode);
    form.append("expiryHours", expiry);
    form.append("maxDownloads", maxViews);
    return fetch("/api/share", { method: "POST", body: form });
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(resultCode);
      setCopied(true);
    } catch {
      setError("Clipboard access is unavailable. Select and copy the code instead.");
    }
  }

  return (
    <section className="transfer-workspace" aria-label="Share content">
      <div className="cipher-rain" aria-hidden="true">
        <span>010101 110010 001101 101011 010010 110101</span>
        <span>100101 011010 111001 001101 101010 010110</span>
        <span>011101 101001 010110 110010 001011 101100</span>
        <span>110001 010101 101010 001110 011001 110100</span>
      </div>
      <div className="home-tools">
        <div className="tool-panel send-panel">
          <div className="panel-heading">
            <span className="panel-mark send-mark" aria-hidden="true">↑</span>
            <div>
              <h2>Send content</h2>
              <p>Create a share code for text or a file.</p>
            </div>
          </div>
          <div className="mode-switch" role="group" aria-label="Content type">
            <button
              className={mode === "text" ? "mode-option active" : "mode-option"}
              type="button"
              aria-pressed={mode === "text"}
              onClick={() => setMode("text")}
            >
              Text or code
            </button>
            <button
              className={mode === "file" ? "mode-option active" : "mode-option"}
              type="button"
              aria-pressed={mode === "file"}
              onClick={() => setMode("file")}
            >
              Send a file
            </button>
          </div>
          {resultCode ? (
            <div className="share-result" aria-live="polite">
              <p className="result-kicker">Your share code is ready</p>
              <strong className="code result-code">{resultCode}</strong>
              <div className="row result-actions">
                <button className="btn" type="button" onClick={copyCode}>
                  {copied ? "Copied" : "Copy code"}
                </button>
                <Link
                  className="btn secondary"
                  href={`/access?code=${encodeURIComponent(resultCode)}`}
                >
                  Open share
                </Link>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setResultCode("")}
                >
                  Create another
                </button>
              </div>
              <p className="privacy-note">
                Anyone with the code can access this share. Support staff may
                access stored shares for recovery requests.
              </p>
            </div>
          ) : (
            <div className="transfer-form">
              {mode === "text" ? (
                <>
                  <label className="label" htmlFor="share-text">Text or code</label>
                  <textarea
                    className="textarea transfer-textarea"
                    id="share-text"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    maxLength={500000}
                    placeholder="Paste or type text, code snippets, notes, or links here..."
                  />
                  <div className="field-row">
                    <div className="field-grow">
                      <label className="label" htmlFor="share-title">Title (optional)</label>
                      <input
                        className="input"
                        id="share-title"
                        maxLength={120}
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Give this share a title"
                      />
                    </div>
                    <div className="field-grow">
                      <label className="label" htmlFor="share-code-custom">Custom code</label>
                      <input
                        className="input"
                        id="share-code-custom"
                        maxLength={32}
                        value={shareCode}
                        onChange={(event) => setShareCode(event.target.value.toUpperCase())}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <label className="label" htmlFor="share-file">Choose a file (up to 25 MB)</label>
                  <input
                    className="input file-input"
                    id="share-file"
                    type="file"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                  />
                  {file && (
                    <p className="file-detail">
                      {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                  <div className="field-row">
                    <div className="field-grow">
                      <label className="label" htmlFor="file-share-code">Custom code</label>
                      <input
                        className="input"
                        id="file-share-code"
                        maxLength={32}
                        value={shareCode}
                        onChange={(event) => setShareCode(event.target.value.toUpperCase())}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="field-row settings-row">
                <div className="field-grow">
                  <label className="label" htmlFor="share-expiry">Expiration</label>
                  <select
                    className="select"
                    id="share-expiry"
                    value={expiry}
                    onChange={(event) => setExpiry(event.target.value)}
                  >
                    <option value="1">1 hour</option>
                    <option value="24">24 hours</option>
                    <option value="168">7 days</option>
                  </select>
                </div>
                <div className="field-grow">
                  <label className="label" htmlFor="share-limit">
                    {mode === "text" ? "Maximum views" : "Maximum downloads"}
                  </label>
                  <select
                    className="select"
                    id="share-limit"
                    value={maxViews}
                    onChange={(event) => setMaxViews(event.target.value)}
                  >
                    <option value="1">1</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="1000000">Unlimited</option>
                  </select>
                </div>
              </div>
              <p className="privacy-note">
                Shares are stored temporarily. Anyone with the code can access
                them, and support staff may access them for recovery.
              </p>
              {error && <div className="notice error" role="alert">{error}</div>}
              <button
                className="btn create-share-button"
                type="button"
                disabled={busy || (mode === "text" ? !content.trim() : !file)}
                onClick={createShare}
              >
                {busy ? "Creating share..." : "Generate share code"}
              </button>
            </div>
          )}
          {!resultCode && !error && (
            <p className="workspace-footnote">Temporary access · Choose your own expiry and limit</p>
          )}
        </div>
        <div className="tool-panel receive-panel">
          <div className="panel-heading">
            <span className="panel-mark receive-mark" aria-hidden="true">#</span>
            <div>
              <h2>Receive content</h2>
              <p>Enter the share code you received.</p>
            </div>
          </div>
          <form className="receive-form" action="/access" method="get">
            <label className="label" htmlFor="share-code">Share code</label>
            <input
              className="input code-input"
              id="share-code"
              name="code"
              value={receiveCode}
              onChange={(event) => setReceiveCode(event.target.value.toUpperCase())}
              placeholder="Enter your code"
              autoCapitalize="characters"
              maxLength={32}
              required
            />
            <button className="btn" type="submit" disabled={!receiveCode.trim()}>
              Retrieve content
            </button>
          </form>
          <div className="receive-hint">
            <span className="receive-hint-mark" aria-hidden="true">i</span>
            <p>Codes are case-insensitive. Content may be available only once.</p>
          </div>
        </div>
      </div>
    </section>
  );
}