"use client";

import { useEffect, useRef } from "react";
import {
  LoaderCircle,
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
    isLoading,
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

  useEffect(() => {
    reported.current = null;
  }, [track?.id]);

  async function reportQualifiedPlay() {
    if (!track) return;

    const audio = audioRef.current;

    if (
      !audio ||
      audio.currentTime < 30 ||
      reported.current === track.id
    ) {
      return;
    }

    reported.current = track.id;

    await fetch(`/api/tracks/${track.id}/play`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    <>
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={reportQualifiedPlay}
      />

      {track && (
        <aside className="persistent-player" aria-label="Now playing">
          <div className="player-inner">
            <div className="player-primary-controls">
              <button
                type="button"
                className="player-icon-button secondary-control"
                onClick={previous}
                aria-label="Previous track"
              >
                <SkipBack size={16} fill="currentColor" />
              </button>

              <button
                type="button"
                className="player-play-button"
                onClick={toggle}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <LoaderCircle className="player-spinner" size={19} />
                ) : isPlaying ? (
                  <Pause size={19} fill="currentColor" />
                ) : (
                  <Play size={19} fill="currentColor" />
                )}
              </button>

              <button
                type="button"
                className="player-icon-button secondary-control"
                onClick={next}
                aria-label="Next track"
              >
                <SkipForward size={16} fill="currentColor" />
              </button>
            </div>

            <img
              className="player-artwork"
              src={track.artwork}
              alt={`${track.title} artwork`}
            />

            <div className="player-copy">
              <strong>{track.title}</strong>
              <span>{track.artist}</span>
            </div>

            <div className="player-wave">
              <Waveform
                currentTime={currentTime}
                duration={duration}
                onSeek={seek}
              />
            </div>

            <div className="player-time">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>

            <label className="player-volume">
              <Volume2 size={16} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(event) =>
                  setVolume(Number(event.target.value))
                }
                aria-label="Volume"
              />
            </label>
          </div>
        </aside>
      )}
    </>
  );
}
