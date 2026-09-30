"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
export default function Access() {
  return (
    <Suspense fallback={<main className="shell" />}>
      <AccessContent />
    </Suspense>
  );
}

function AccessContent() {
  const q = useSearchParams();
  const [code, setCode] = useState(q.get("code") || "");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function open() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.error || "Share unavailable");
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Share unavailable");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (q.get("code")) open();
  }, []);
  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          Code<span>Drop</span>
        </Link>
      </nav>
      <div className="page">
        <h1>{data ? "Shared Content" : "Enter Your Share Code"}</h1>
        {!data ? (
          <div className="card stack">
            <p className="muted">
              Enter the code you received to access the shared content.
            </p>
            <input
              className="input"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))
              }
              placeholder="Enter share code"
              maxLength={32}
            />
            <button className="btn" disabled={busy || !code} onClick={open}>
              {busy ? "Opening..." : "Open Share"}
            </button>
            {err && <div className="notice error">{err}</div>}
            <div className="notice">
              <b>Forgot your code?</b>
              <br />
              Contact CodeDrop Support. CodeDrop may be able to assist with code
              recovery after reviewing your request.
              <br />
              <br />
              <Link href="/support">Contact Support →</Link>
            </div>
          </div>
        ) : (
          <div className="stack">
            {data.kind === "text" ? (
              <>
                <div className="notice">
                  {data.title || "Shared Text"} · Expires{" "}
                  {new Date(data.expires_at).toLocaleString()}
                </div>
                <div className="contentbox">{data.content}</div>
                <div className="row">
                  <button
                    className="btn"
                    onClick={() => navigator.clipboard.writeText(data.content)}
                  >
                    Copy
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => window.print()}
                  >
                    Print
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => setData(null)}
                  >
                    Lock
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="card">
                  <h2>{data.file_name}</h2>
                  <p className="muted">
                    {data.mime_type || "Document"} ·{" "}
                    {data.file_size
                      ? `${(data.file_size / 1024 / 1024).toFixed(2)} MB`
                      : ""}
                  </p>
                  <a className="btn" href={data.download_url}>
                    Download Document
                  </a>
                </div>
                <button className="btn secondary" onClick={() => setData(null)}>
                  Lock
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
