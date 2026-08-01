import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-auth";
import { makeSession, paths, readSession, slug } from "@/lib/upload-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await getApiAdmin();
  if (access.error) return access.error;
  const { admin, user } = access;
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

    const { data: userList, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

    let artistUser = userList.users.find((u: { email?: string | null }) => u.email?.toLowerCase() === email);
    if (!artistUser) {
      const created = await admin.auth.admin.createUser({
        email, email_confirm: true, password: `${randomUUID()}Aa1!`,
        user_metadata: { display_name: artistName, account_type: "artist" },
      });
      if (created.error || !created.data.user) {
        return NextResponse.json({ error: created.error?.message || "Could not create artist." }, { status: 400 });
      }
      artistUser = created.data.user;
    }

    const { data: existingProfile } = await admin
      .from("profiles").select("role,status").eq("id", artistUser.id).maybeSingle();

    await admin.from("profiles").upsert({
      id: artistUser.id,
      email,
      display_name: artistName,
      role: existingProfile?.role || "artist",
      status: existingProfile?.status || "active",
      updated_at: new Date().toISOString(),
    });

    await admin.from("artist_profiles").upsert({
      user_id: artistUser.id,
      artist_name: artistName,
      slug: `${slug(artistName) || "artist"}-${artistUser.id.slice(0, 6)}`,
      contact_email: email,
      primary_social_platform: body.socialPlatform || null,
      primary_social_url: body.socialUrl || null,
      updated_at: new Date().toISOString(),
    });

    const objectPaths = paths(artistUser.id, body.artworkType);
    const [audio, artwork] = await Promise.all([
      admin.storage.from("approved-track-audio").createSignedUploadUrl(objectPaths.audioPath),
      admin.storage.from("track-artwork").createSignedUploadUrl(objectPaths.artworkPath),
    ]);
    if (audio.error || artwork.error) {
      return NextResponse.json({ error: audio.error?.message || artwork.error?.message }, { status: 500 });
    }

    return NextResponse.json({
      ...objectPaths,
      audioToken: audio.data.token,
      artworkToken: artwork.data.token,
      sessionToken: makeSession({
        ownerId: user.id, artistId: artistUser.id, ...objectPaths, mode: "admin",
      }),
    });
  }

  const session = readSession(String(body.sessionToken || ""));
  if (!session || session.ownerId !== user.id || session.mode !== "admin") {
    return NextResponse.json({ error: "Upload session expired or invalid." }, { status: 403 });
  }

  if (body.action === "cleanup") {
    await Promise.all([
      admin.storage.from("approved-track-audio").remove([session.audioPath]),
      admin.storage.from("track-artwork").remove([session.artworkPath]),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "finalize") {
    const title = String(body.title || "").trim();
    const token = session.audioPath.split("/").pop()?.replace(".mp3", "").slice(0, 8);
    const { data: track, error } = await admin.from("tracks").insert({
      artist_id: session.artistId,
      title,
      slug: `${slug(title) || "track"}-${token}`,
      artwork_path: session.artworkPath,
      mp3_path: session.audioPath,

      // Compatibility with the original tracks schema.
      cover_path: session.artworkPath,
      audio_path: session.audioPath,

      status: "published",
      chart_eligible: true,
      published_at: new Date().toISOString(),
    }).select("id").single();

    if (error) {
      await Promise.all([
        admin.storage.from("approved-track-audio").remove([session.audioPath]),
        admin.storage.from("track-artwork").remove([session.artworkPath]),
      ]);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await admin.from("audit_logs").insert({
      admin_id: user.id, action: "admin_upload", track_id: track.id, subject_user_id: session.artistId,
    });
    await admin.rpc("recalculate_weekly_chart");
    return NextResponse.json({ ok: true, trackId: track.id });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
