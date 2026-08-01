# Indie Billboard v2

Clean Next.js 16 + Supabase rebuild.

## Important improvements

- Direct browser-to-Supabase signed uploads for MP3 and artwork
- No large MP3 payload passes through a Vercel Function
- Existing admin role is preserved when uploading music under the admin email
- Artist uploads use the same secure direct-upload architecture
- Visible progress and error messages
- Admin submission audio preview
- Approval moves files into published buckets
- Denial deletes pending files
- Chart recalculates after publish, approval, like, vote, and qualified play
- Playback uses private signed audio URLs
- Repeated plays are rate-limited by listener hash and chart cooldown

## Setup

1. Run `supabase/V2-COMPATIBILITY.sql`.
2. Add the five environment variables from `.env.example` in Vercel.
3. Push this project to GitHub.
4. Import or redeploy in Vercel.
5. Update Supabase Auth URL Configuration with the Vercel URL.

## Environment variables

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY
- NEXT_PUBLIC_SITE_URL
- APP_SIGNING_SECRET

Never commit `.env.local`.
