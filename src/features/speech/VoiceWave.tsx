type VoiceWaveProps = {
  level: number;
  bars?: number;
  className?: string;
  variant?: 'compact' | 'bar';
};

const COMPACT_BAR_SCALE = [0.42, 0.7, 0.95, 1, 0.95, 0.7, 0.42];

export function VoiceWave({
  level,
  bars,
  className = '',
  variant = 'compact'
}: VoiceWaveProps) {
  const compact = variant === 'compact';
  const count = bars ?? (compact ? COMPACT_BAR_SCALE.length : 24);
  const clamped = Math.max(0.18, Math.min(1, level));

  return (
    <span
      className={`voice-wave ${compact ? 'voice-wave-premium' : 'voice-wave-bar-row'} inline-flex items-center justify-center ${className}`}
      style={{ ['--voice-level' as string]: String(clamped) }}
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="voice-wave-bar"
          style={{
            animationDelay: `${i * 0.07}s`,
            ['--bar-scale' as string]: String(compact ? COMPACT_BAR_SCALE[i] ?? 0.6 : 0.7)
          }}
        />
      ))}
    </span>
  );
}
