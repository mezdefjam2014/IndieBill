import { randomUUID } from "crypto";
import { signPayload, verifyPayload } from "@/lib/security";

export function artworkExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export function makeSession(values: {
  ownerId: string; artistId: string; audioPath: string; artworkPath: string; mode: string;
}) {
  return signPayload({ ...values, expires: String(Date.now() + 2 * 60 * 60 * 1000) });
}

export function readSession(token: string) {
  const payload = verifyPayload(token);
  if (!payload || Number(payload.expires) < Date.now()) return null;
  return payload;
}

export function paths(artistId: string, artworkType: string) {
  const id = randomUUID();
  return {
    audioPath: `${artistId}/${id}.mp3`,
    artworkPath: `${artistId}/${id}.${artworkExtension(artworkType)}`,
  };
}

export function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
