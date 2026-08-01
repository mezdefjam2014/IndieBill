import { createHash, createHmac, timingSafeEqual } from "crypto";

function secret() {
  const value = process.env.APP_SIGNING_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!value) throw new Error("Missing APP_SIGNING_SECRET.");
  return value;
}

export function signPayload(payload: Record<string, string>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyPayload(token: string) {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<string, string>;
  } catch {
    return null;
  }
}

export function listenerHash(ip: string, userAgent: string) {
  return createHash("sha256")
    .update(`${ip}:${userAgent}:${secret()}`)
    .digest("hex");
}
