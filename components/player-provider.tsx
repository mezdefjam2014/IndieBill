"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
};

type PlayerValue = {
  track: PlayerTrack | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  start: (track: PlayerTrack, queue?: PlayerTrack[]) => Promise<void>;
  toggle: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  previous: () => void;
};

const PlayerContext = createContext<PlayerValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reportedTrack = useRef<string | null>(null);

  const start = useCallback(
    async (nextTrack: PlayerTrack, nextQueue?: PlayerTrack[]) => {
      if (nextQueue?.length) {
        setQueue(nextQueue);
      }

      const audio = audioRef.current;
      if (!audio) {
        throw new Error("The audio player is not ready.");
      }

      if (track?.id === nextTrack.id) {
        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
        }
        return;
      }

      setTrack(nextTrack);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(true);

      // Assigning the route directly preserves the original click gesture.
      // The route redirects the audio element to a short-lived signed URL.
      const streamUrl = `/api/tracks/${nextTrack.id}/stream`;
      audio.pause();
      audio.src = streamUrl;
      audio.currentTime = 0;
      audio.load();

      try {
        await audio.play();
      } catch (error) {
        setIsLoading(false);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Your browser blocked automatic playback."
        );
      }
    },
    [track?.id]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;

    const safeDuration = Number.isFinite(audio.duration)
      ? audio.duration
      : seconds;

    audio.currentTime = Math.max(0, Math.min(seconds, safeDuration));
    setCurrentTime(audio.currentTime);
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    const normalized = Math.max(0, Math.min(1, nextVolume));
    setVolumeState(normalized);

    if (audioRef.current) {
      audioRef.current.volume = normalized;
    }
  }, []);

  const playRelative = useCallback(
    (direction: 1 | -1) => {
      if (!track || !queue.length) return;

      const index = queue.findIndex((item) => item.id === track.id);
      const nextIndex =
        index < 0
          ? 0
          : (index + direction + queue.length) % queue.length;

      void start(queue[nextIndex], queue);
    },
    [queue, start, track]
  );

  const next = useCallback(() => playRelative(1), [playRelative]);
  const previous = useCallback(() => playRelative(-1), [playRelative]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(audio.duration || 0);
    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onEnded = () => next();

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEnded);
    };
  }, [next]);


  useEffect(() => {
    reportedTrack.current = null;
  }, [track?.id]);

  async function reportQualifiedPlay() {
    const currentTrack = track;
    const audio = audioRef.current;

    if (
      !currentTrack ||
      !audio ||
      audio.currentTime < 30 ||
      reportedTrack.current === currentTrack.id
    ) {
      return;
    }

    reportedTrack.current = currentTrack.id;

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
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <PlayerContext.Provider
      value={{
        track,
        queue,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        audioRef,
        start,
        toggle,
        seek,
        setVolume,
        next,
        previous,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        className="chart-audio-engine"
        preload="metadata"
        onTimeUpdate={reportQualifiedPlay}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const value = useContext(PlayerContext);

  if (!value) {
    throw new Error("PlayerProvider missing.");
  }

  return value;
}
