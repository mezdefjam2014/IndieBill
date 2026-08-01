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
  audioUrl?: string;
};

type PlayerValue = {
  track: PlayerTrack | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const resolveAudioUrl = useCallback(async (item: PlayerTrack) => {
    if (item.audioUrl) return item.audioUrl;

    const response = await fetch(`/api/tracks/${item.id}/stream`, {
      method: "POST",
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.signedUrl) {
      throw new Error(result.error || "Unable to load this track.");
    }

    return String(result.signedUrl);
  }, []);

  const start = useCallback(
    async (nextTrack: PlayerTrack, nextQueue?: PlayerTrack[]) => {
      if (nextQueue?.length) setQueue(nextQueue);

      if (track?.id === nextTrack.id && audioRef.current) {
        if (audioRef.current.paused) {
          await audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
        return;
      }

      const audioUrl = await resolveAudioUrl(nextTrack);
      const resolved = { ...nextTrack, audioUrl };

      setTrack(resolved);
      setCurrentTime(0);
      setDuration(0);

      window.setTimeout(async () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        try {
          await audio.play();
        } catch {
          setIsPlaying(false);
        }
      }, 0);
    },
    [resolveAudioUrl, track?.id]
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
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || seconds));
    setCurrentTime(audio.currentTime);
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    const normalized = Math.max(0, Math.min(1, nextVolume));
    setVolumeState(normalized);
    if (audioRef.current) audioRef.current.volume = normalized;
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
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => next();

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [next, track?.id]);

  return (
    <PlayerContext.Provider
      value={{
        track,
        queue,
        isPlaying,
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
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("PlayerProvider missing.");
  return value;
}
