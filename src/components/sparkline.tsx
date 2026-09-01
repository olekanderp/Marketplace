/** Deterministic "market trend" sparkline derived from a seed string. */

function seededSeries(seed: string, points: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  const values: number[] = [];
  for (let i = 0; i < points; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    values.push(0.25 + ((h >>> 0) % 1000) / 1000 * 0.7);
  }
  return values;
}

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
  const values = seededSeries(seed, points);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const stepX = width / (points - 1);
  const coords = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * (height - 6) - 3;
    return [x, y] as const;
  });
  const d = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const rising = coords[coords.length - 1][1] < coords[0][1];
  const stroke = rising ? "var(--color-positive-600)" : "var(--color-brand-600)";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={`${d} L${width} ${height} L0 ${height} Z`} fill={stroke} opacity={0.08} />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
