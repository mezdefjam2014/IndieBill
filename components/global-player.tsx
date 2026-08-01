"use client";

import { useRef } from "react";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { usePlayer } from "@/components/player-provider";
import { Waveform } from "@/components/waveform";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export function GlobalPlayer() {
  const {
    track,
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    toggle,
    seek,
    setVolume,
    next,
    previous,
  } = usePlayer();
  const reported = useRef<string | null>(null);

  if (!track) return null;

  const currentTrack = track;

  async function reportQualifiedPlay() {
    const audio = audioRef.current;
    if (
      !audio ||
      audio.currentTime < 30 ||
      reported.current === currentTrack.id
    ) {
      return;
    }

    reported.current = currentTrack.id;

    await fetch(`/api/tracks/${currentTrack.id}/play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listenedSeconds: Math.floor(audio.currentTime),
        completionPercent: audio.duration
          ? Math.min(
              100,
              Math.round((audio.currentTime / audio.duration) * 100)
            )
          : 0,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <aside className="persistent-player" aria-label="Now playing">
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        preload="metadata"
        onTimeUpdate={reportQualifiedPlay}
      />

      <div className="player-controls">
        <button type="button" onClick={previous} aria-label="Previous track">
          <SkipBack size={18} fill="currentColor" />
        </button>
        <button
          type="button"
          className="player-main-button"
          onClick={toggle}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
        </button>
        <button type="button" onClick={next} aria-label="Next track">
          <SkipForward size={18} fill="currentColor" />
        </button>
      </div>

      <img
        className="player-artwork"
        src={currentTrack.artwork}
        alt={`${currentTrack.title} artwork`}
      />

      <div className="player-copy">
        <strong>{currentTrack.title}</strong>
        <span>{currentTrack.artist}</span>
      </div>

      <div className="player-timeline">
        <span>{formatTime(currentTime)}</span>
        <Waveform
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
        />
        <span>{formatTime(duration)}</span>
      </div>

      <label className="player-volume">
        <Volume2 size={17} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volume"
        />
      </label>
    </aside>
  );
}
