import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function createStreamResponse(id: string) {
  const admin = createAdminClient();

  const { data: track, error: trackError } = await admin
    .from("tracks")
    .select("mp3_path,audio_path,status")
    .eq("id", id)
    .single();

  if (
    trackError ||
    !track ||
    String(track.status) !== "published"
  ) {
    return NextResponse.json(
      { error: "Track unavailable." },
      { status: 404 }
    );
  }

  const path = track.mp3_path || track.audio_path;

  if (!path) {
    return NextResponse.json(
      { error: "Track audio is missing." },
      { status: 404 }
    );
  }

  const { data, error } = await admin.storage
    .from("approved-track-audio")
    .createSignedUrl(path, 900);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: error?.message || "Unable to create stream URL." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.signedUrl, 307);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return createStreamResponse(id);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return createStreamResponse(id);
}
