"use client";

// TODO(B): replace these schematic shapes with an accurate hand-drawn-style SVG of Vietnam.
// REQUIRED: the map must include Hoàng Sa and Trường Sa. Keep the same region ids so hover/click still work.

const REGIONS = [
  { id: "tay-bac", label: "Tây Bắc", d: "M40 30 L95 20 L110 70 L70 95 L35 75 Z", locked: true },
  { id: "bac-bo", label: "Bắc Bộ", d: "M95 20 L160 30 L165 85 L120 100 L110 70 Z", locked: false },
  { id: "hue", label: "Huế", d: "M120 100 L165 85 L175 150 L185 215 L160 225 L140 160 Z", locked: false },
  { id: "nam-bo", label: "Nam Bộ", d: "M160 225 L185 215 L205 280 L180 330 L125 335 L130 290 Z", locked: false },
];

export function VietnamMap({
  active,
  onHover,
  onSelect,
}: {
  active: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <svg viewBox="0 0 320 360" className="h-full w-full" role="img" aria-label="Bản đồ Việt Nam">
      {REGIONS.map((r) => (
        <g
          key={r.id}
          onMouseEnter={() => onHover(r.id)}
          onMouseLeave={() => onHover(null)}
          onClick={() => !r.locked && onSelect(r.id)}
          className={r.locked ? "cursor-not-allowed" : "cursor-pointer"}
        >
          <path
            d={r.d}
            fill={r.locked ? "#d6d3d1" : active === r.id ? "#c9a227" : "#e8dcc0"}
            stroke="#5b4636"
            strokeWidth={1.5}
          />
        </g>
      ))}
      {/* Islands: always shown */}
      <g fill="#5b4636" fontSize="10">
        <circle cx="245" cy="120" r="3" />
        <circle cx="252" cy="126" r="2" />
        <text x="232" y="110">Hoàng Sa</text>
        <circle cx="270" cy="270" r="3" />
        <circle cx="278" cy="262" r="2" />
        <circle cx="262" cy="280" r="2" />
        <text x="250" y="300">Trường Sa</text>
      </g>
    </svg>
  );
}
