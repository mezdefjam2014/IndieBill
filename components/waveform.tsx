"use client";

type WaveformProps = {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  compact?: boolean;
};

const BARS = [
  18, 30, 44, 24, 58, 36, 68, 28, 50, 76, 34, 62, 22, 46, 72, 40,
  54, 26, 64, 38, 80, 32, 56, 24, 48, 70, 36, 60, 28, 52, 74, 34,
  58, 20, 66, 42, 78, 30, 54, 26, 48, 72, 38, 62, 24, 68, 40, 76,
  32, 56, 22, 64, 36, 74, 28, 52, 20, 70, 40, 60, 26, 78, 44, 56,
  24, 66, 34, 72, 30, 50, 22, 62, 38, 76, 28, 54, 42, 68, 24, 58,
];

export function Waveform({
  currentTime,
  duration,
  onSeek,
  compact = false,
}: WaveformProps) {
  const progress =
    duration > 0
      ? Math.max(0, Math.min(1, currentTime / duration))
      : 0;

  function seek(event: React.PointerEvent<HTMLButtonElement>) {
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
      onPointerDown={seek}
      aria-label="Seek through track"
    >
      <span className="waveform-bars" aria-hidden="true">
        {BARS.map((height, index) => {
          const filled = index / (BARS.length - 1) <= progress;

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
