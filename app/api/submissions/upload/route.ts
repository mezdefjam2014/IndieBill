import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { makeSession, paths, readSession, slug } from "@/lib/upload-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await getApiUser();
  if (access.error) return access.error;
  const { admin, user, profile } = access;
  if (profile?.submissions_disabled) {
    return NextResponse.json({ error: "Submissions are disabled for this account." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));

  if (body.action === "prepare") {
    const artistName = String(body.artistName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const title = String(body.title || "").trim();
    if (!artistName || !email || !title) {
      return NextResponse.json({ error: "Artist name, email, and title are required." }, { status: 400 });
    }
    if (body.audioType !== "audio/mpeg" || Number(body.audioSize) > 52_428_800) {
      return NextResponse.json({ error: "A valid MP3 up to 50 MB is required." }, { status: 400 });
    }
    if (!["image/jpeg","image/png","image/webp"].includes(body.artworkType) || Number(body.artworkSize) > 10_485_760) {
      return NextResponse.json({ error: "Valid artwork up to 10 MB is required." }, { status: 400 });
    }

    await admin.from("artist_profiles").upsert({
      user_id: user.id,
      artist_name: artistName,
      slug: `${slug(artistName) || "artist"}-${user.id.slice(0, 6)}`,
      contact_email: email,
      primary_social_platform: body.socialPlatform || null,
      primary_social_url: body.socialUrl || null,
      updated_at: new Date().toISOString(),
    });

    const objectPaths = paths(user.id, body.artworkType);
    const [audio, artwork] = await Promise.all([
      admin.storage.from("pending-track-audio").createSignedUploadUrl(objectPaths.audioPath),
      admin.storage.from("pending-track-artwork").createSignedUploadUrl(objectPaths.artworkPath),
    ]);
    if (audio.error || artwork.error) {
      return NextResponse.json({ error: audio.error?.message || artwork.error?.message }, { status: 500 });
    }

    return NextResponse.json({
      ...objectPaths,
      audioToken: audio.data.token,
      artworkToken: artwork.data.token,
      sessionToken: makeSession({
        ownerId: user.id, artistId: user.id, ...objectPaths, mode: "artist",
      }),
    });
  }

  const session = readSession(String(body.sessionToken || ""));
  if (!session || session.ownerId !== user.id || session.mode !== "artist") {
    return NextResponse.json({ error: "Upload session expired or invalid." }, { status: 403 });
  }

  if (body.action === "cleanup") {
    await Promise.all([
      admin.storage.from("pending-track-audio").remove([session.audioPath]),
      admin.storage.from("pending-track-artwork").remove([session.artworkPath]),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "finalize") {
    const { error } = await admin.from("track_submissions").insert({
      artist_id: user.id,
      artist_name: String(body.artistName || ""),
      contact_email: String(body.email || ""),
      track_title: String(body.title || ""),
      social_platform: body.socialPlatform || null,
      social_url: body.socialUrl || null,
      artwork_path: session.artworkPath,
      mp3_path: session.audioPath,
      mp3_size_bytes: Number(body.audioSize || 0),
      rights_confirmed: true,
      terms_accepted: true,
      status: "pending",
    });
    if (error) {
      await Promise.all([
        admin.storage.from("pending-track-audio").remove([session.audioPath]),
        admin.storage.from("pending-track-artwork").remove([session.artworkPath]),
      ]);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
