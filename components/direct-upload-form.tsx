"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "artist" | "admin";
type Prepare = {
  sessionToken: string;
  audioPath: string;
  artworkPath: string;
  audioToken: string;
  artworkToken: string;
};

export function DirectUploadForm({ mode }: { mode: Mode }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function api(body: Record<string, unknown>) {
    const endpoint = mode === "admin" ? "/api/admin/upload" : "/api/submissions/upload";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({ error: "Unreadable server response." }));
    if (!response.ok) throw new Error(result.error || "Request failed.");
    return result;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const formElement = e.currentTarget;
    const f = new FormData(formElement);
    const audio = f.get("audio");
    const artwork = f.get("artwork");

    if (!(audio instanceof File) || !(artwork instanceof File)) {
      setStatus("Choose both artwork and an MP3."); setBusy(false); return;
    }
    if (audio.type !== "audio/mpeg" || !audio.name.toLowerCase().endsWith(".mp3")) {
      setStatus("The audio file must be an MP3."); setBusy(false); return;
    }
    if (audio.size > 52_428_800) {
      setStatus("The MP3 must be 50 MB or smaller."); setBusy(false); return;
    }
    if (!["image/jpeg","image/png","image/webp"].includes(artwork.type) || artwork.size > 10_485_760) {
      setStatus("Artwork must be JPG, PNG, or WebP and 10 MB or smaller."); setBusy(false); return;
    }

    const metadata = {
      artistName: String(f.get("artist_name") || "").trim(),
      email: String(f.get("email") || "").trim(),
      title: String(f.get("title") || "").trim(),
      socialPlatform: String(f.get("social_platform") || "website"),
      socialUrl: String(f.get("social_url") || "").trim(),
      audioName: audio.name, audioType: audio.type, audioSize: audio.size,
      artworkName: artwork.name, artworkType: artwork.type, artworkSize: artwork.size,
    };

    let prepared: Prepare | null = null;
    try {
      setStatus("Preparing secure upload…");
      prepared = await api({ action: "prepare", ...metadata });
      const supabase = createClient();

      setStatus("Uploading MP3…");
      const audioResult = await supabase.storage
        .from(mode === "admin" ? "approved-track-audio" : "pending-track-audio")
        .uploadToSignedUrl(prepared!.audioPath, prepared!.audioToken, audio, {
          contentType: "audio/mpeg", upsert: false,
        });
      if (audioResult.error) throw new Error(`MP3 upload failed: ${audioResult.error.message}`);

      setStatus("Uploading artwork…");
      const artworkResult = await supabase.storage
        .from(mode === "admin" ? "track-artwork" : "pending-track-artwork")
        .uploadToSignedUrl(prepared!.artworkPath, prepared!.artworkToken, artwork, {
          contentType: artwork.type, upsert: false,
        });
      if (artworkResult.error) throw new Error(`Artwork upload failed: ${artworkResult.error.message}`);

      setStatus(mode === "admin" ? "Publishing track…" : "Sending for review…");
      await api({ action: "finalize", sessionToken: prepared!.sessionToken, ...metadata });
      formElement.reset();
      setStatus(mode === "admin"
        ? "Track published successfully and added to the chart."
        : "Submission received and sent to the admin review queue.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
      if (prepared) {
        await api({ action: "cleanup", sessionToken: prepared!.sessionToken }).catch(() => undefined);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form upload" onSubmit={submit}>
      <span className="eyebrow">{mode === "admin" ? "ADMIN DIRECT UPLOAD · V2" : "ARTIST SUBMISSION"}</span>
      <h1>{mode === "admin" ? "Publish a track" : "Submit a track"}</h1>
      <p>{mode === "admin" ? "Upload and publish immediately." : "One MP3 at a time. One submission every seven days."}</p>
      <div className="form-grid">
        <label>Artist name<input name="artist_name" required maxLength={100}/></label>
        <label>Artist email<input name="email" type="email" required/></label>
        <label>Track title<input name="title" required maxLength={150}/></label>
        <label>Social platform<select name="social_platform"><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="x">X</option><option value="soundcloud">SoundCloud</option><option value="spotify">Spotify</option><option value="website">Website</option></select></label>
        <label className="full">Social link<input name="social_url" type="url"/></label>
        <label>Artwork<input name="artwork" type="file" accept="image/jpeg,image/png,image/webp" required/><small>JPG, PNG, or WebP · 10 MB max</small></label>
        <label>MP3<input name="audio" type="file" accept="audio/mpeg,.mp3" required/><small>MP3 only · 50 MB max</small></label>
      </div>
      <button type="submit" className="button" disabled={busy}>{busy ? "Working…" : mode === "admin" ? "Publish track" : "Submit for review"}</button>
      {status && <p className="message" role="status" aria-live="polite">{status}</p>}
    </form>
  );
}
