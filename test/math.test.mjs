// Regression checks for the ported projection + scoring logic (run: `npm test`).
import { project } from "../src/data/projection.js";
import { score } from "../src/data/scoring.js";
import { FMT } from "../src/data/fmt.js";
import { CONTENT } from "../src/data/content.js";

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log("  ok   " + name + (detail ? "  (" + detail + ")" : ""));
  } else {
    fail++;
    console.log("  FAIL " + name + (detail ? "  (" + detail + ")" : ""));
  }
}

// 1) Projection signal for the prototype's four sample cases.
const cases = {
  A: { age: 58, retireAge: 65, province: "ON", rrsp: 1400000, tfsa: 200000, nonreg: 1200000, savings: 60000, spending: 110000, style: "balanced", feePct: 1.0, gainShare: 50 },
  B: { age: 47, retireAge: 65, province: "ON", rrsp: 220000, tfsa: 80000, nonreg: 50000, savings: 12000, spending: 60000, style: "balanced", feePct: 1.0, gainShare: 50 },
  C: { age: 33, retireAge: 65, province: "BC", rrsp: 60000, tfsa: 40000, nonreg: 20000, savings: 10000, spending: 55000, style: "growth", feePct: 1.0, gainShare: 50 },
  D: { age: 60, retireAge: 62, province: "ON", rrsp: 1800000, tfsa: 250000, nonreg: 1950000, savings: 50000, spending: 90000, style: "balanced", feePct: 1.0, gainShare: 50 }
};
console.log("Projection (signal / estate / CRA / depletionAge):");
const sig = {};
for (const [k, inp] of Object.entries(cases)) {
  const p = project(inp);
  sig[k] = p.signal;
  console.log(
    "  " + k + ": " + p.signal +
    " / " + (p.depletionAge ? "depleted@" + p.depletionAge : FMT.moneyRough(p.estate)) +
    " / CRA " + FMT.moneyRough(p.cra)
  );
}
console.log("Signal expectations:");
check("A grows to an estate (Building)", sig.A === "Building");
check("D surplus is High", sig.D === "High");
check("B depletes (Low)", sig.B === "Low", sig.B);
check("C depletes (Low)", sig.C === "Low", sig.C);

// 2) Scoring normalisation + Q8 exclusion.
console.log("Scoring:");
const allBest = {};
CONTENT.mindset.forEach((q) => (allBest[q.id] = 0)); // index 0 = score 3
check("all-best intentionality = 100", score(allBest, { signal: "Low" }).intentionality === 100,
  String(score(allBest, { signal: "Low" }).intentionality));

const allWorst = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3 }; // index 3 = score 0 (q8 idx3 excluded)
check("all-worst intentionality = 0", score(allWorst, { signal: "Low" }).intentionality === 0,
  String(score(allWorst, { signal: "Low" }).intentionality));

const q8excluded = { q1: 0, q8: 3 }; // q8 "doesn't apply" must not dilute the score
check("Q8 excluded from normalisation", score(q8excluded, { signal: "Low" }).intentionality === 100,
  String(score(q8excluded, { signal: "Low" }).intentionality));

// 3) 2x2 profile mapping (intentionality >=50 = high; signal High = high surplus).
const hi = { q1: 0, q2: 0, q3: 0, q4: 0 }; // 100% -> high intent
const lo = { q1: 3, q2: 3, q3: 3, q4: 3 }; // 0% -> low intent
console.log("Profiles:");
check("high intent + High  -> D", score(hi, { signal: "High" }).profile === "D");
check("low intent  + High  -> A", score(lo, { signal: "High" }).profile === "A");
check("high intent + Build -> B", score(hi, { signal: "Building" }).profile === "B");
check("low intent  + Build -> C", score(lo, { signal: "Building" }).profile === "C");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
