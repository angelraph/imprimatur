// Line drawings for the landing page. Each one is a picture of what the card says.

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1, vectorEffect: "non-scaling-stroke" as const };

// Three stacked sheets: the cases, the replies, the ground truth.
export function StackArt() {
  const sheet = (y: number, label: string, opacity: number) => (
    <g opacity={opacity}>
      <path d={`M160 ${y} 290 ${y + 50} 160 ${y + 100} 30 ${y + 50}Z`} {...stroke} />
      <path d={`M30 ${y + 50}v8l130 50 130-50v-8`} {...stroke} />
      <text x="232" y={y + 96} fontSize="8" fill="currentColor" fontFamily="var(--font-plex-mono)" transform={`rotate(-21 232 ${y + 96})`}>
        {label}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 320 250" className="h-full w-full text-muted" aria-hidden>
      {sheet(120, "GROUND TRUTH", 1)}
      {sheet(65, "REPLIES", 0.75)}
      {sheet(10, "CASES", 0.5)}
      <path d="M160 60 290 110 160 160 30 110Z" fill="var(--accent)" opacity="0.12" />
    </svg>
  );
}

// Many measurements narrowing to one number.
export function FunnelArt() {
  const lines = Array.from({ length: 22 }, (_, i) => {
    const y = 20 + i * 10;
    return `M10 ${y} C 120 ${y}, 150 125, 250 125 L 310 125`;
  });
  return (
    <svg viewBox="0 0 320 250" className="h-full w-full text-muted" aria-hidden>
      {lines.map((d, i) => (
        <path key={d} d={d} {...stroke} opacity={0.25 + (i % 5) * 0.12} />
      ))}
      <circle cx="310" cy="125" r="4" fill="var(--accent)" />
    </svg>
  );
}

// A loop that climbs: sit, be criticised, re-sit higher.
export function LoopArt() {
  return (
    <svg viewBox="0 0 320 250" className="h-full w-full text-muted" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx={70 + i * 60} cy={170 - i * 36} rx="46" ry="18" {...stroke} opacity={0.35 + i * 0.2} />
      ))}
      <path d="M70 170 130 134 190 98 250 62" stroke="var(--accent)" strokeWidth="1.5" fill="none" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={70 + i * 60} cy={170 - i * 36} r="3.5" fill="var(--accent)" />
      ))}
    </svg>
  );
}

// The orbit from the logo, used behind the hero.
export function OrbitArt() {
  return (
    <svg viewBox="0 0 600 600" className="h-full w-full" aria-hidden>
      <g className="orbit">
        <ellipse cx="300" cy="300" rx="280" ry="96" fill="none" stroke="url(#o)" strokeWidth="1.2" transform="rotate(-18 300 300)" />
        <ellipse cx="300" cy="300" rx="230" ry="150" fill="none" stroke="url(#o)" strokeWidth="0.8" opacity="0.5" transform="rotate(24 300 300)" />
      </g>
      <defs>
        <linearGradient id="o" x1="0" x2="1">
          <stop offset="0" stopColor="#8f73ff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8f73ff" />
          <stop offset="1" stopColor="#8f73ff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
