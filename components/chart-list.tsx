"use client";

import {
  Heart,
  Minus,
  Pause,
  Play,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { usePlayer, type PlayerTrack } from "@/components/player-provider";
import { Waveform } from "@/components/waveform";
import type { ChartTrack } from "@/lib/chart";

type EngagementState = Record<
  string,
  { likes: number; votes: number; liked?: boolean; voted?: boolean }
>;

export function ChartList({ tracks }: { tracks: ChartTrack[] }) {
  const {
    track: activeTrack,
    isPlaying,
    currentTime,
    duration,
    start,
    toggle,
    seek,
  } = usePlayer();
  const [engagement, setEngagement] = useState<EngagementState>(() =>
    Object.fromEntries(
      tracks.map((track) => [
        track.id,
        { likes: track.likes, votes: track.votes },
      ])
    )
  );
  const [engagementBusy, setEngagementBusy] = useState("");

  const queue = useMemo<PlayerTrack[]>(
    () =>
      tracks.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artistName,
        artwork: track.artworkUrl,
      })),
    [tracks]
  );

  async function play(track: ChartTrack) {
    if (activeTrack?.id === track.id) {
      toggle();
      return;
    }

    try {
      await start(
        {
          id: track.id,
          title: track.title,
          artist: track.artistName,
          artwork: track.artworkUrl,
        },
        queue
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to play track.");
    }
  }

  async function engage(id: string, action: "like" | "vote") {
    const key = `${id}:${action}`;
    if (engagementBusy === key) return;

    const current = engagement[id];
    if (
      (action === "like" && current?.liked) ||
      (action === "vote" && current?.voted)
    ) {
      return;
    }

    setEngagementBusy(key);
    setEngagement((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        likes:
          action === "like"
            ? (previous[id]?.likes ?? 0) + 1
            : previous[id]?.likes ?? 0,
        votes:
          action === "vote"
            ? (previous[id]?.votes ?? 0) + 1
            : previous[id]?.votes ?? 0,
        liked: action === "like" ? true : previous[id]?.liked,
        voted: action === "vote" ? true : previous[id]?.voted,
      },
    }));

    const response = await fetch(`/api/tracks/${id}/${action}`, {
      method: "POST",
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setEngagement((previous) => ({
        ...previous,
        [id]: {
          ...previous[id],
          likes:
            action === "like"
              ? Math.max(0, (previous[id]?.likes ?? 1) - 1)
              : previous[id]?.likes ?? 0,
          votes:
            action === "vote"
              ? Math.max(0, (previous[id]?.votes ?? 1) - 1)
              : previous[id]?.votes ?? 0,
          liked: action === "like" ? false : previous[id]?.liked,
          voted: action === "vote" ? false : previous[id]?.voted,
        },
      }));
      alert(result.error || "Action failed.");
    }

    setEngagementBusy("");
  }

  return (
    <div className="chart">
      <div className="chart-head">
        <span>#</span>
        <span>Song</span>
        <span>Artist</span>
        <span>Plays</span>
        <span>Likes</span>
        <span>Votes</span>
        <span>Move</span>
      </div>

      {tracks.map((track) => {
        const movement = track.previousRank
          ? track.previousRank - track.rank
          : 0;
        const active = activeTrack?.id === track.id;
        const metrics = engagement[track.id] || {
          likes: track.likes,
          votes: track.votes,
        };

        return (
          <article
            className={`chart-row ${active ? "chart-row-active" : ""}`}
            key={track.id}
          >
            <div className={`rank ${track.rank <= 3 ? "rank-top" : ""}`}>
              {track.rank}
            </div>

            <div className="song">
              <img src={track.artworkUrl} alt={`${track.title} artwork`} />
              <button
                type="button"
                onClick={() => play(track)}
                aria-label={
                  active && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
                }
              >
                {active && isPlaying ? (
                  <Pause size={15} fill="currentColor" />
                ) : (
                  <Play size={15} fill="currentColor" />
                )}
              </button>
              <div className="song-copy">
                <strong>{track.title}</strong>
                <small>
                  {track.verified
                    ? "✓ Verified artist"
                    : "Independent release"}
                </small>
                {active && (
                  <div className="chart-inline-player">
                    <Waveform
                      compact
                      currentTime={currentTime}
                      duration={duration}
                      onSeek={seek}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <strong>{track.artistName}</strong>
              {track.socialUrl && (
                <a
                  className="social"
                  href={track.socialUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  ↗
                </a>
              )}
            </div>

            <div>{track.plays.toLocaleString()}</div>

            <button
              className={`metric ${metrics.liked ? "metric-active" : ""}`}
              type="button"
              disabled={engagementBusy === `${track.id}:like`}
              onClick={() => engage(track.id, "like")}
            >
              <Heart size={17} fill={metrics.liked ? "currentColor" : "none"} />
              {metrics.likes}
            </button>

            <button
              className={`metric ${metrics.voted ? "metric-active" : ""}`}
              type="button"
              disabled={engagementBusy === `${track.id}:vote`}
              onClick={() => engage(track.id, "vote")}
            >
              <Star size={17} fill={metrics.voted ? "currentColor" : "none"} />
              {metrics.votes}
            </button>

            <div
              className={
                movement > 0 ? "up" : movement < 0 ? "down" : "flat"
              }
            >
              {movement > 0 ? (
                <>
                  <TrendingUp size={16} />
                  {movement}
                </>
              ) : movement < 0 ? (
                <>
                  <TrendingDown size={16} />
                  {Math.abs(movement)}
                </>
              ) : (
                <Minus size={16} />
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
