"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminPromotions from "@/components/AdminPromotions";
import MaintenanceControl from "@/components/MaintenanceControl";
export default function Admin() {
  const [logged, setLogged] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [unlockingDocument, setUnlockingDocument] = useState<string | null>(null);
  const [unlockedDocuments, setUnlockedDocuments] = useState<Record<string, string>>({});
  const [revealedRecoveryCodes, setRevealedRecoveryCodes] = useState<Record<string, boolean>>({});
  const [recoveryActionId, setRecoveryActionId] = useState<string | null>(null);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  async function login() {
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error);
      return;
    }
    setLogged(true);
    load();
  }
  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/overview");
    if (r.status === 401) {
      setLogged(false);
      setLoading(false);
      return;
    }
    const j = await r.json();
    setLogged(true);
    setData(j);
    setLoading(false);
  }
  async function unlockDocument(shareId: string) {
    setUnlockingDocument(shareId);
    setDocumentError("");
    try {
      const response = await fetch("/api/admin/document", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shareId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not unlock document.");
      setUnlockedDocuments((current) => ({ ...current, [shareId]: result.url }));
    } catch (error) {
      setDocumentError(
        error instanceof Error ? error.message : "Could not unlock document.",
      );
    } finally {
      setUnlockingDocument(null);
    }
  }
  async function resolveRecovery(requestId: string) {
    setRecoveryActionId(requestId);
    setRecoveryMessage("");
    try {
      const response = await fetch("/api/admin/recovery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: requestId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not resolve request.");
      setData((current: any) => ({
        ...current,
        recovery: current.recovery.map((request: any) =>
          request.id === requestId ? { ...request, status: "resolved" } : request,
        ),
      }));
      setRecoveryMessage(
        result.emailSent
          ? "Recovery marked successful and requester emailed."
          : "Recovery marked successful, but no email was sent. Configure the mail provider to enable notifications.",
      );
    } catch (error) {
      setRecoveryMessage(
        error instanceof Error ? error.message : "Could not resolve request.",
      );
    } finally {
      setRecoveryActionId(null);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!logged) return;
    const events = new EventSource("/api/admin/realtime");
    const refresh = async () => {
      const response = await fetch("/api/admin/overview");
      if (response.status === 401) {
        setLogged(false);
        return;
      }
      if (response.ok) setData(await response.json());
    };
    events.addEventListener("refresh", refresh);
    return () => events.close();
  }, [logged]);
  if (!logged && !data)
    return (
      <main className="shell">
        <div className="page card stack">
          <Link className="brand" href="/">
            Drop<span>Codes</span>
          </Link>
          <h1>Admin Access</h1>
          <p className="muted">
            Enter the administrator access code. There is no admin email login.
          </p>
          <input
            className="input"
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Admin access code"
          />
          <button className="btn" onClick={login}>
            Open Admin Dashboard
          </button>
          {err && <div className="notice error">{err}</div>}
        </div>
      </main>
    );
  return (
    <main className="admin">
      <nav className="nav">
        <Link className="brand" href="/">
          Drop<span>Codes</span> Admin
        </Link>
        <div className="row">
          <button className="btn secondary" onClick={() => location.reload()}>
            Refresh
          </button>
          <a className="btn" href="/api/admin/export">
            Export Excel
          </a>
        </div>
      </nav>
      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        data && (
          <>
            <div className="statgrid">
              {[
                ["Total Shares", data.stats.total],
                ["Active", data.stats.active],
                ["Expired", data.stats.expired],
                ["Text", data.stats.text],
                ["Documents", data.stats.documents],
              ].map(([a, b]) => (
                <div className="stat" key={String(a)}>
                  <span className="muted">{a}</span>
                  <strong>{b}</strong>
                </div>
              ))}
            </div>
            <MaintenanceControl />
            <AdminPromotions />
            <section className="card" style={{ marginTop: 18 }}>
              <h2>Monetization</h2>
              <p className="muted">
                Core sharing remains free. These statuses show configuration
                only; no ad, sponsor, or affiliate receives share content.
              </p>
              <div className="statgrid">
                {[
                  [
                    "Advertisements",
                    data.monetization.advertisementsConfigured
                      ? "Configured (opt-in)"
                      : data.monetization.advertisementsEnabled
                        ? "Missing client or slot"
                        : "Off",
                  ],
                  [
                    "Sponsor",
                    data.monetization.sponsorConfigured ? "Configured" : "Off",
                  ],
                  [
                    "Support URL",
                    data.monetization.supportUrlConfigured
                      ? "Configured"
                      : "Not configured",
                  ],
                  [
                    "Partnership contact",
                    data.monetization.partnershipContactConfigured
                      ? "Configured"
                      : "Not configured",
                  ],
                  [
                    "Affiliate tools",
                    `${data.monetization.affiliateCount} configured`,
                  ],
                ].map(([label, value]) => (
                  <div className="stat" key={label}>
                    <span className="muted">{label}</span>
                    <strong className="monetization-stat-value">{value}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="card" style={{ marginTop: 18 }}>
              <h2>All Shares</h2>
              <p className="muted">
                Administrative view includes stored share codes and text content
                because DropCodes is designed to support code recovery.
              </p>
              <div className="tablewrap">
                {documentError && <div className="notice error">{documentError}</div>}
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Title/File</th>
                      <th>Created</th>
                      <th>Expires</th>
                      <th>Views</th>
                      <th>Limit</th>
                      <th>Content</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.shares.map((x: any) => (
                      <tr key={x.id}>
                        <td>{x.share_code}</td>
                        <td>{x.kind}</td>
                        <td>{x.title || x.file_name || "—"}</td>
                        <td>{new Date(x.created_at).toLocaleString()}</td>
                        <td>{new Date(x.expires_at).toLocaleString()}</td>
                        <td>{x.view_count}</td>
                        <td>
                          {x.max_views >= 1000000 ? "Unlimited" : x.max_views}
                        </td>
                        <td>
                          {x.kind === "text"
                            ? (x.encrypted_content || "").slice(0, 120)
                            : (
                                <div className="stack">
                                  <span>{x.file_name || "Document"}</span>
                                  <button
                                    className="btn secondary"
                                    disabled={unlockingDocument === x.id}
                                    onClick={() => unlockDocument(x.id)}
                                  >
                                    {unlockingDocument === x.id
                                      ? "Unlocking..."
                                      : unlockedDocuments[x.id]
                                        ? "Refresh access"
                                        : "Unlock"}
                                  </button>
                                  {unlockedDocuments[x.id] && (
                                    <a
                                      className="btn"
                                      href={unlockedDocuments[x.id]}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open document
                                    </a>
                                  )}
                                </div>
                              )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="card" style={{ marginTop: 18 }}>
              <h2>Recovery Requests</h2>
              {recoveryMessage && <div className="notice">{recoveryMessage}</div>}
              {data.recovery.length === 0 ? (
                <p className="muted">No recovery requests yet.</p>
              ) : (
                <div className="tablewrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Share</th>
                        <th>Status</th>
                        <th>Action</th>
                        <th>Reason</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recovery.map((x: any) => (
                        <tr key={x.id}>
                          <td>{x.id}</td>
                          <td>{x.requester_email}</td>
                          <td>
                            {x.share_code ? (
                              <div className="stack">
                                <span>
                                  {revealedRecoveryCodes[x.id]
                                    ? x.share_code
                                    : "Code stored"}
                                </span>
                                <button
                                  className="btn secondary"
                                  onClick={() =>
                                    setRevealedRecoveryCodes((current) => ({
                                      ...current,
                                      [x.id]: !current[x.id],
                                    }))
                                  }
                                >
                                  {revealedRecoveryCodes[x.id] ? "Hide code" : "Unlock code"}
                                </button>
                              </div>
                            ) : (
                              "No code attached"
                            )}
                          </td>
                          <td>{x.status}</td>
                          <td>
                            {x.status === "resolved" ? (
                              "Done"
                            ) : (
                              <button
                                className="btn"
                                disabled={recoveryActionId === x.id}
                                onClick={() => resolveRecovery(x.id)}
                              >
                                {recoveryActionId === x.id ? "Resolving..." : "Mark recovered"}
                              </button>
                            )}
                          </td>
                          <td>{x.reason}</td>
                          <td>{new Date(x.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )
      )}
    </main>
  );
}
