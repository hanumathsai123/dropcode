"use client";

import { useEffect, useState } from "react";
import PromotionCard from "@/components/PromotionCard";
import {
  MAX_PROMOTION_IMAGE_BYTES,
  MAX_PROMOTION_VIDEO_BYTES,
  validatePromotionMedia,
  type PromotionMediaType,
  type PromotionView,
} from "@/lib/promotions";

type PromotionRecord = PromotionView & {
  media_path: string;
  start_at: string;
  end_at: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

type PromotionForm = {
  company_name: string;
  title: string;
  description: string;
  destination_url: string;
  button_text: string;
  button_alignment: "left" | "right";
  start_at: string;
  end_at: string;
  enabled: boolean;
  media_path: string;
  media_type: PromotionMediaType | "";
  media_url: string;
};

function dateInputValue(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function newPromotionForm(): PromotionForm {
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    company_name: "",
    title: "",
    description: "",
    destination_url: "",
    button_text: "Learn More",
    button_alignment: "right",
    start_at: dateInputValue(now.toISOString()),
    end_at: dateInputValue(end.toISOString()),
    enabled: false,
    media_path: "",
    media_type: "",
    media_url: "",
  };
}

function promotionStatus(promotion: PromotionRecord) {
  const now = Date.now();
  if (!promotion.enabled) return "Disabled";
  if (now < new Date(promotion.start_at).getTime()) return "Scheduled";
  if (now > new Date(promotion.end_at).getTime()) return "Expired";
  return "Active";
}

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [form, setForm] = useState<PromotionForm>(newPromotionForm);
  const [editingId, setEditingId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [previewPromotion, setPreviewPromotion] = useState<PromotionView | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const response = await fetch("/api/admin/promotions", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load promotions.");
      setPromotions(result.promotions || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load promotions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  function resetForm() {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl("");
    setFile(null);
    setEditingId("");
    setForm(newPromotionForm());
    setError("");
  }

  function editPromotion(promotion: PromotionRecord) {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl("");
    setFile(null);
    setEditingId(promotion.id);
    setForm({
      company_name: promotion.company_name,
      title: promotion.title,
      description: promotion.description,
      destination_url: promotion.destination_url,
      button_text: promotion.button_text,
      button_alignment: promotion.button_alignment || "right",
      start_at: dateInputValue(promotion.start_at),
      end_at: dateInputValue(promotion.end_at),
      enabled: promotion.enabled,
      media_path: promotion.media_path,
      media_type: promotion.media_type,
      media_url: promotion.media_url,
    });
    setError("");
  }

  function selectFile(selected: File | undefined) {
    if (!selected) return;
    const validation = validatePromotionMedia(
      selected.name,
      selected.type,
      selected.size,
    );
    if ("error" in validation) {
      setError(validation.error || "This media file is not supported.");
      return;
    }

    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setFile(selected);
    setLocalPreviewUrl(URL.createObjectURL(selected));
    setForm((current) => ({ ...current, media_type: validation.mediaType }));
    setError("");
  }

  function removeSelectedFile() {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl("");
    setFile(null);
    if (editingId) {
      const existing = promotions.find((promotion) => promotion.id === editingId);
      setForm((current) => ({
        ...current,
        media_path: existing?.media_path || "",
        media_type: existing?.media_type || "",
        media_url: existing?.media_url || "",
      }));
    } else {
      setForm((current) => ({ ...current, media_path: "", media_type: "", media_url: "" }));
    }
  }

  async function uploadSelectedFile() {
    if (!file) return { path: form.media_path, mediaType: form.media_type };

    const ticketResponse = await fetch("/api/admin/promotions/upload-ticket", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });
    const ticket = await ticketResponse.json();
    if (!ticketResponse.ok) throw new Error(ticket.error || "Could not prepare media upload.");

    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!publicKey) throw new Error("Supabase publishable key is not configured.");

    const uploadBody = new FormData();
    uploadBody.append("cacheControl", "3600");
    uploadBody.append("", file);
    const uploadResponse = await fetch(ticket.signedUrl, {
      method: "PUT",
      headers: {
        apikey: publicKey,
        Authorization: `Bearer ${publicKey}`,
        "x-upsert": "false",
      },
      body: uploadBody,
    });
    if (!uploadResponse.ok) {
      throw new Error("Media upload failed. Check the promotion-media bucket and try again.");
    }

    return { path: ticket.path as string, mediaType: ticket.mediaType as PromotionMediaType };
  }

  async function removeUploadedPath(path: string) {
    await fetch("/api/admin/promotions/upload-ticket", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => undefined);
  }

  function currentPreview(): PromotionView | null {
    const mediaUrl = localPreviewUrl || form.media_url;
    if (!mediaUrl || !form.media_type) return null;
    return {
      id: editingId || "preview",
      company_name: form.company_name || "Company name",
      title: form.title || "Promotion title",
      description: form.description,
      destination_url: form.destination_url || "https://example.invalid",
      button_text: form.button_text || "Learn More",
      button_alignment: form.button_alignment,
      media_type: form.media_type,
      media_url: mediaUrl,
    };
  }

  async function savePromotion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    let uploadedPath = "";

    try {
      const uploaded = await uploadSelectedFile();
      if (file) uploadedPath = uploaded.path;
      const payload = {
        ...form,
        id: editingId || undefined,
        media_path: uploaded.path,
        media_type: uploaded.mediaType,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
      };
      const response = await fetch("/api/admin/promotions", {
        method: editingId ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save promotion.");
      resetForm();
      await refresh();
    } catch (caught) {
      if (uploadedPath) await removeUploadedPath(uploadedPath);
      setError(caught instanceof Error ? caught.message : "Could not save promotion.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePromotion(promotion: PromotionRecord) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/promotions", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...promotion, enabled: !promotion.enabled }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update promotion.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update promotion.");
    } finally {
      setBusy(false);
    }
  }

  async function deletePromotion(promotion: PromotionRecord) {
    if (!window.confirm(`Delete the promotion for ${promotion.company_name}?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/promotions", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: promotion.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete promotion.");
      if (editingId === promotion.id) resetForm();
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete promotion.");
    } finally {
      setBusy(false);
    }
  }

  const preview = currentPreview();
  const imageLimitMb = Math.round(MAX_PROMOTION_IMAGE_BYTES / 1024 / 1024);
  const videoLimitMb = Math.round(MAX_PROMOTION_VIDEO_BYTES / 1024 / 1024);

  return (
    <section className="card promotion-admin" style={{ marginTop: 18 }}>
      <div className="promotion-admin-header">
        <div>
          <span className="promotion-label">Admin only</span>
          <h2>Promotions</h2>
          <p className="muted">
            Manage sponsored placements shown outside sharing and private content.
          </p>
        </div>
        <button className="btn secondary" onClick={resetForm}>
          + Add Promotion
        </button>
      </div>

      <form className="promotion-form" onSubmit={savePromotion}>
        <h3>{editingId ? "Edit Promotion" : "Add Promotion"}</h3>
        <div className="promotion-form-grid">
          <label className="label">
            Promotion/Company Name
            <input className="input" required maxLength={120} value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} />
          </label>
          <label className="label">
            Promotion Title
            <input className="input" required maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="label promotion-form-wide">
            Description
            <textarea className="textarea promotion-description-input" maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="label">
            Website/Destination URL
            <input className="input" type="url" required pattern="https://.*" value={form.destination_url} onChange={(event) => setForm({ ...form, destination_url: event.target.value })} />
          </label>
          <label className="label">
            Button Text
            <input className="input" required maxLength={60} value={form.button_text} onChange={(event) => setForm({ ...form, button_text: event.target.value })} />
          </label>
          <label className="label">
            Button Position
            <select className="select" value={form.button_alignment} onChange={(event) => setForm({ ...form, button_alignment: event.target.value as "left" | "right" })}>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="label">
            Start Date
            <input className="input" type="datetime-local" required value={form.start_at} onChange={(event) => setForm({ ...form, start_at: event.target.value })} />
          </label>
          <label className="label">
            End Date
            <input className="input" type="datetime-local" required value={form.end_at} onChange={(event) => setForm({ ...form, end_at: event.target.value })} />
          </label>
          <label className="label">
            Status
            <select className="select" value={form.enabled ? "enabled" : "disabled"} onChange={(event) => setForm({ ...form, enabled: event.target.value === "enabled" })}>
              <option value="disabled">Disabled</option>
              <option value="enabled">Enabled</option>
            </select>
          </label>
        </div>

        <div className="promotion-upload-area">
          <div>
            <h3>Media</h3>
            <p className="muted">
              Choose one image or video. Images up to {imageLimitMb} MB; videos up to {videoLimitMb} MB.
            </p>
          </div>
          <label className="btn promotion-add-media">
            + Add Media
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
          </label>
        </div>

        {preview && (
          <div className="promotion-admin-preview">
            <div className="promotion-admin-preview-heading">
              <strong>Preview</strong>
              {file && (
                <button className="btn secondary" type="button" onClick={removeSelectedFile}>
                  Remove
                </button>
              )}
            </div>
            <PromotionCard promotion={preview} preview />
          </div>
        )}

        {error && <div className="notice error">{error}</div>}
        <div className="row">
          <button className="btn" disabled={busy || loading || (!file && !form.media_path)} type="submit">
            {busy ? "Saving..." : editingId ? "Save Changes" : "Save Promotion"}
          </button>
          {editingId && <button className="btn secondary" type="button" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </form>

      <div className="promotion-list">
        <h3>Existing Promotions</h3>
        {loading ? (
          <p className="muted">Loading promotions...</p>
        ) : promotions.length === 0 ? (
          <p className="muted">No promotions yet.</p>
        ) : (
          <div className="promotion-table-wrap">
            <table className="promotion-table">
              <thead>
                <tr><th>Promotion</th><th>Media</th><th>Button</th><th>Status</th><th>Start</th><th>End</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {promotions.map((promotion) => (
                  <tr key={promotion.id}>
                    <td><strong>{promotion.company_name}</strong><span>{promotion.title}</span></td>
                    <td>{promotion.media_type === "video" ? "Video" : "Image"}</td>
                    <td>{promotion.button_alignment === "left" ? "Left" : "Right"}</td>
                    <td><span className={`promotion-status ${promotionStatus(promotion).toLowerCase()}`}>{promotionStatus(promotion)}</span></td>
                    <td>{new Date(promotion.start_at).toLocaleString()}</td>
                    <td>{new Date(promotion.end_at).toLocaleString()}</td>
                    <td>
                      <div className="promotion-actions">
                        <button className="btn secondary" type="button" onClick={() => setPreviewPromotion(promotion)}>Preview</button>
                        <button className="btn secondary" type="button" disabled={busy} onClick={() => void togglePromotion(promotion)}>{promotion.enabled ? "Disable" : "Enable"}</button>
                        <button className="btn secondary" type="button" onClick={() => editPromotion(promotion)}>Edit</button>
                        <button className="btn danger" type="button" disabled={busy} onClick={() => void deletePromotion(promotion)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewPromotion && (
        <div className="promotion-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewPromotion(null); }}>
          <div className="promotion-modal" role="dialog" aria-modal="true" aria-labelledby="promotion-preview-title">
            <div className="promotion-admin-preview-heading">
              <h3 id="promotion-preview-title">Promotion Preview</h3>
              <button className="btn secondary" onClick={() => setPreviewPromotion(null)}>Close</button>
            </div>
            <PromotionCard promotion={previewPromotion} preview />
          </div>
        </div>
      )}
    </section>
  );
}
