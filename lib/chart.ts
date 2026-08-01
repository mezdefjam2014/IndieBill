import { createClient } from "@/lib/supabase/server";

export type ChartTrack = {
  id: string;
  title: string;
  artistName: string;
  verified: boolean;
  socialUrl: string | null;
  artworkUrl: string;
  rank: number;
  previousRank: number | null;
  plays: number;
  likes: number;
  votes: number;
};

export function chartWeek() {
  const d = new Date();
  const mondayOffset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - mondayOffset);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function loadChart(): Promise<ChartTrack[]> {
  const supabase = await createClient();
  const { data: rankings } = await supabase
    .from("chart_rankings")
    .select("track_id,current_rank,previous_rank,qualified_plays,likes,votes")
    .eq("chart_week", chartWeek())
    .order("current_rank");

  const ids = (rankings || []).map((r: { track_id: string }) => r.track_id);
  if (!ids.length) return [];

  const { data: tracks } = await supabase
    .from("tracks")
    .select("id,title,artist_id,artwork_path")
    .in("id", ids)
    .eq("status", "published");

  const artistIds = [...new Set((tracks || []).map((t: { artist_id: string }) => t.artist_id))];
  const { data: artists } = await supabase
    .from("artist_profiles")
    .select("user_id,artist_name,is_verified,primary_social_url")
    .in("user_id", artistIds);

  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/track-artwork/`;

  return (rankings || []).map((r: any) => {
    const track = (tracks || []).find((t: any) => t.id === r.track_id);
    const artist = (artists || []).find((a: any) => a.user_id === track?.artist_id);
    return {
      id: r.track_id,
      title: track?.title || "Untitled",
      artistName: artist?.artist_name || "Unknown artist",
      verified: Boolean(artist?.is_verified),
      socialUrl: artist?.primary_social_url || null,
      artworkUrl: track?.artwork_path?.startsWith("http")
        ? track.artwork_path
        : `${publicBase}${track?.artwork_path || ""}`,
      rank: r.current_rank,
      previousRank: r.previous_rank,
      plays: r.qualified_plays,
      likes: r.likes,
      votes: r.votes,
    };
  });
}
