// Scoring (ported from window.RPG_SCORE).
// Intentionality from mindset answers; surplus signal from the projection.
// 2x2: high surplus + low intent = A; high surplus + high intent = D;
//      low/building surplus + high intent = B; else = C.

import { CONTENT } from "./content.js";

export function score(answers, projection) {
  let pts = 0;
  let max = 0;
  CONTENT.mindset.forEach((q) => {
    const idx = answers[q.id];
    if (idx == null) return;
    const a = q.answers[idx];
    if (a.excluded) return;
    pts += a.score;
    max += 3;
  });
  const intentionality = max > 0 ? Math.round((pts / max) * 100) : 0;

  const signal = projection ? projection.signal : "Low";
  const highIntent = intentionality >= 50;
  const highSurplus = signal === "High";
  const profile = highSurplus ? (highIntent ? "D" : "A") : highIntent ? "B" : "C";

  const surplusFrac = signal === "High" ? 0.85 : signal === "Building" ? 0.5 : 0.15;

  return { intentionality, signal, surplusFrac, profile };
}

export default score;
