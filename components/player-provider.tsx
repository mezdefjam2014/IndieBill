"use client";
import { createContext, useContext, useRef, useState } from "react";

type Track = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  audioUrl: string;
};
type Value = {
  track: Track | null;
  start: (track: Track) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
};

const Context = createContext<Value | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  function start(next: Track) {
    setTrack(next);
    window.setTimeout(() => audioRef.current?.play(), 80);
  }
  return <Context.Provider value={{ track, start, audioRef }}>{children}</Context.Provider>;
}

export function usePlayer() {
  const value = useContext(Context);
  if (!value) throw new Error("PlayerProvider missing.");
  return value;
}
