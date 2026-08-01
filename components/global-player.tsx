"use client";

import { useRef } from "react";
import { usePlayer } from "@/components/player-provider";

export function GlobalPlayer() {
  const { track, audioRef } = usePlayer();
  const reported = useRef<string | null>(null);

  if (!track) {
    return null;
  }

  const currentTrack = track;

  async function progress() {
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
    }).catch(() => undefined);
  }

  return (
    <div className="player">
      <img src={currentTrack.artwork} alt="" />
      <div>
        <strong>{currentTrack.title}</strong>
        <span>{currentTrack.artist}</span>
      </div>
      <audio
        ref={audioRef}
        controls
        src={currentTrack.audioUrl}
        onTimeUpdate={progress}
      />
    </div>
  );
}
