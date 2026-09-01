/** Deterministic "market trend" sparkline derived from a seed string. */
export function Sparkline({
  seed,
  width = 132,
  height = 40,
  points = 8,
}: {
  seed: string;
  width?: number;
  height?: number;
  points?: number;
}) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };

  const values = Array.from({ length: points }, () => 0.25 + rand() * 0.7);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const stepX = width / (points - 1);
  const coords = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * (height - 6) - 3;
    return [x, y] as const;
  });
  const d = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const rising = coords[coords.length - 1][1] < coords[0][1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path
        d={`${d} L${width} ${height} L0 ${height} Z`}
        fill={rising ? "var(--color-positive-600)" : "var(--color-brand-600)"}
        opacity={0.08}
      />
      <path
        d={d}
        fill="none"
        stroke={rising ? "var(--color-positive-600)" : "var(--color-brand-600)"}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
