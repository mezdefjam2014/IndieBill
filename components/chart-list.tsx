"use client";
import { Heart, Play, Star, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useState } from "react";
import { usePlayer } from "@/components/player-provider";
import type { ChartTrack } from "@/lib/chart";

export function ChartList({ tracks }: { tracks: ChartTrack[] }) {
  const { start } = usePlayer();
  const [busy, setBusy] = useState("");

  async function play(track: ChartTrack) {
    setBusy(track.id);
    const response = await fetch(`/api/tracks/${track.id}/stream`, { method: "POST" });
    const result = await response.json();
    setBusy("");
    if (!response.ok) return alert(result.error || "Unable to play track.");
    start({
      id: track.id,
      title: track.title,
      artist: track.artistName,
      artwork: track.artworkUrl,
      audioUrl: result.signedUrl,
    });
  }

  async function engage(id: string, action: "like" | "vote") {
    const response = await fetch(`/api/tracks/${id}/${action}`, { method: "POST" });
    const result = await response.json();
    if (!response.ok) return alert(result.error || "Action failed.");
    window.location.reload();
  }

  return (
    <div className="chart">
      <div className="chart-head">
        <span>#</span><span>Song</span><span>Artist</span>
        <span>Plays</span><span>Likes</span><span>Votes</span><span>Move</span>
      </div>
      {tracks.map((track) => {
        const move = track.previousRank ? track.previousRank - track.rank : 0;
        return (
          <div className="chart-row" key={track.id}>
            <div className={`rank ${track.rank <= 3 ? "rank-top" : ""}`}>{track.rank}</div>
            <div className="song">
              <img src={track.artworkUrl} alt={`${track.title} artwork`} />
              <button disabled={busy === track.id} onClick={() => play(track)} aria-label={`Play ${track.title}`}>
                <Play size={15} fill="currentColor" />
              </button>
              <div><strong>{track.title}</strong><small>{track.verified ? "✓ Verified artist" : "Independent release"}</small></div>
            </div>
            <div><strong>{track.artistName}</strong>{track.socialUrl && <a className="social" href={track.socialUrl} target="_blank">↗</a>}</div>
            <div>{track.plays.toLocaleString()}</div>
            <button className="metric" onClick={() => engage(track.id, "like")}><Heart size={17}/>{track.likes}</button>
            <button className="metric" onClick={() => engage(track.id, "vote")}><Star size={17}/>{track.votes}</button>
            <div className={move > 0 ? "up" : move < 0 ? "down" : "flat"}>
              {move > 0 ? <><TrendingUp size={16}/>{move}</> : move < 0 ? <><TrendingDown size={16}/>{Math.abs(move)}</> : <Minus size={16}/>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
