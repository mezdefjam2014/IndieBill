# Deployment

## Replace GitHub
Upload the contents of this ZIP to the root of the existing repository and replace the old files.

## Supabase
Run:

Supabase Dashboard → SQL Editor → New Query → paste `supabase/V2-COMPATIBILITY.sql` → Run.

## Vercel variables
Vercel Dashboard → Project → Settings → Environment Variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY
- NEXT_PUBLIC_SITE_URL
- APP_SIGNING_SECRET

Use a long random value for APP_SIGNING_SECRET.

## Verify
After deployment, `/admin/upload` must show:

ADMIN DIRECT UPLOAD · V2

Then test a small MP3 first, followed by a full-length MP3.
