import { useState, useEffect } from "react";

// Horizontal arc, light blue band, two needles (intentionality + surplus signal).
// Values are 0..1 fractions. No percentages displayed.
export function Gauge({ intent, surplus, animate }) {
  const [sweep, setSweep] = useState(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) {
      setSweep(1);
      return;
    }
    const id = setTimeout(() => setSweep(1), 20); // not rAF: suspended when hidden
    return () => clearTimeout(id);
  }, [animate]);

  const cx = 170;
  const cy = 168;
  const r = 128;
  const band = 26;

  function arcPoint(frac, radius) {
    const ang = Math.PI * (1 - frac);
    return [cx + radius * Math.cos(ang), cy - radius * Math.sin(ang)];
  }
  const [sx, sy] = arcPoint(0, r);
  const [ex, ey] = arcPoint(1, r);

  function needle(frac, color, solid) {
    const deg = -90 + frac * 180; // rotate from pointing up
    return (
      <g
        style={{
          transform: "rotate(" + deg * sweep + "deg)",
          transformOrigin: cx + "px " + cy + "px",
          transition: animate ? "transform 1100ms cubic-bezier(0, 0, 0.2, 1)" : "none"
        }}
      >
        <line
          x1={cx}
          y1={cy - 36}
          x2={cx}
          y2={cy - (r + band / 2 + 6)}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy - (r + band / 2 + 6)}
          r="5"
          fill={solid ? color : "var(--sgb-white)"}
          stroke={color}
          strokeWidth="2.5"
        />
      </g>
    );
  }

  return (
    <div className="rpg-gauge-wrap">
      <svg
        viewBox="0 0 340 196"
        role="img"
        aria-label="Gauge showing where your intentionality and surplus signal sit, from low to high"
        style={{ width: "100%", maxWidth: "420px", margin: "0 auto", display: "block" }}
      >
        {/* band */}
        <path
          d={"M " + sx + " " + sy + " A " + r + " " + r + " 0 0 1 " + ex + " " + ey}
          fill="none"
          stroke="var(--sgb-light-blue)"
          strokeWidth={band}
          strokeLinecap="round"
          opacity="0.45"
        />
        {/* tick at midpoint */}
        <line
          x1={arcPoint(0.5, r - band / 2 - 4)[0]}
          y1={arcPoint(0.5, r - band / 2 - 4)[1]}
          x2={arcPoint(0.5, r + band / 2 + 4)[0]}
          y2={arcPoint(0.5, r + band / 2 + 4)[1]}
          stroke="var(--sgb-ink-300)"
          strokeWidth="1.5"
        />
        {needle(intent, "var(--sgb-mid-blue)", true)}
        {needle(surplus, "var(--sgb-dark-blue)", false)}
        <circle cx={cx} cy={cy} r="7" fill="var(--sgb-dark-blue)" />
        <text x={sx - 4} y={cy + 22} fontSize="13" fontWeight="600" fill="var(--sgb-ink-500)" fontFamily="inherit">
          Low
        </text>
        <text
          x={ex + 4}
          y={cy + 22}
          fontSize="13"
          fontWeight="600"
          fill="var(--sgb-ink-500)"
          fontFamily="inherit"
          textAnchor="end"
        >
          High
        </text>
      </svg>
      <div className="rpg-gauge-legend">
        <span className="rpg-gauge-legend-item">
          <span className="rpg-gauge-swatch" style={{ borderColor: "var(--sgb-mid-blue)" }} />
          Intentionality
        </span>
        <span className="rpg-gauge-legend-item">
          <span
            className="rpg-gauge-swatch"
            style={{ borderColor: "var(--sgb-dark-blue)", borderTopStyle: "dashed" }}
          />
          Surplus signal
        </span>
      </div>
    </div>
  );
}

export default Gauge;
