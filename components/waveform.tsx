"use client";

type WaveformProps = {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  compact?: boolean;
};

const BARS = [
  28, 42, 20, 54, 34, 62, 24, 48, 70, 32, 58, 22, 44, 68, 36, 52,
  26, 64, 40, 74, 30, 56, 20, 46, 66, 38, 60, 24, 50, 72, 34, 54,
  22, 62, 42, 76, 30, 58, 26, 48, 68, 36, 56, 20, 64, 40, 72, 28,
  52, 24, 60, 34, 70, 30, 50, 22, 66, 38, 58, 26, 74, 42, 54, 32,
];

export function Waveform({
  currentTime,
  duration,
  onSeek,
  compact = false,
}: WaveformProps) {
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  function seek(event: React.MouseEvent<HTMLButtonElement>) {
    if (!duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width)
    );
    onSeek(ratio * duration);
  }

  return (
    <button
      type="button"
      className={`waveform ${compact ? "waveform-compact" : ""}`}
      onClick={seek}
      aria-label="Seek through track"
    >
      <span className="waveform-bars" aria-hidden="true">
        {BARS.map((height, index) => {
          const filled = index / BARS.length <= progress;
          return (
            <i
              key={`${height}-${index}`}
              className={filled ? "filled" : ""}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </span>
      <span
        className="waveform-playhead"
        style={{ left: `${progress * 100}%` }}
        aria-hidden="true"
      />
    </button>
  );
}
