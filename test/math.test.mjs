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
check("D ends below start after drawdown tax (Building)", sig.D === "Building", sig.D);
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

// 4) Decumulation tax — gross-up of the RRSP/RRIF-sourced portion of withdrawals.
console.log("Drawdown tax:");
const base = { age: 65, retireAge: 65, province: "ON", savings: 0, spending: 50000, style: "balanced", feePct: 1.0, gainShare: 50, retireTax: 25 };
const allR = project({ ...base, rrsp: 1000000, tfsa: 0, nonreg: 0 });
const allT = project({ ...base, rrsp: 0, tfsa: 1000000, nonreg: 0 });
check("RRSP drained faster than TFSA (tax drag)", allR.depletionAge < allT.depletionAge, allR.depletionAge + " < " + allT.depletionAge);
check("TFSA withdrawals incur no drawdown tax", allT.drawdownTax === 0, String(Math.round(allT.drawdownTax)));
check("RRSP withdrawals incur drawdown tax", allR.drawdownTax > 0, String(Math.round(allR.drawdownTax)));
// Hand check: yr1 all-RRSP → grow 1,000,000·1.0202 = 1,020,200; gross = 50,000/(1−0.25) = 66,666.67; end = 953,533.33
const y1 = project({ ...base, rrsp: 1000000, tfsa: 0, nonreg: 0 }).points[1].w;
check("gross-up yr1 balance = 953,533 (hand-verified)", Math.round(y1) === 953533, String(Math.round(y1)));
// retireTax = 0 reproduces the old gross = net behaviour (1,020,200 − 50,000)
const y1NoTax = project({ ...base, rrsp: 1000000, tfsa: 0, nonreg: 0, retireTax: 0 }).points[1].w;
check("retireTax=0 → no gross-up", Math.round(y1NoTax) === 970200, String(Math.round(y1NoTax)));

// 5) Edge cases.
console.log("Edge cases:");
const zero = { age: 50, retireAge: 65, province: "ON", rrsp: 0, tfsa: 0, nonreg: 0, savings: 0, spending: 0, style: "balanced", feePct: 1.0, gainShare: 50 };
const pz = project(zero);
check("empty portfolio is not 'High'", pz.signal !== "High", pz.signal);
check("empty portfolio: estate = 0, cra = 0", pz.estate === 0 && pz.cra === 0);

const spendZero = project({ ...cases.B, spending: 0 });
check("spending=0 never depletes (High)", spendZero.depletionAge === null && spendZero.signal === "High", spendZero.signal);

const savingsSplit = project({ ...zero, savings: 30000 });
check("zero balances: savings split equal thirds yr1", Math.round(savingsSplit.points[1].w) === 30000,
  String(Math.round(savingsSplit.points[1].w)));

// retireAge below current age = already retired; identical to retiring this year.
const already = project({ ...base, rrsp: 1000000, tfsa: 0, nonreg: 0, retireAge: 55 }).points[1].w;
check("retireAge < age decumulates immediately", Math.round(already) === 953533, String(Math.round(already)));

const depleted = project(cases.B);
check("depleted run: estate = 0, cra = 0, signal Low",
  depleted.estate === 0 && depleted.cra === 0 && depleted.signal === "Low");

const pa = project(cases.A);
const sum = pa.breakdown.rrspTax + pa.breakdown.capTax + pa.breakdown.probate;
check("breakdown components sum to cra", Math.abs(sum - pa.cra) < 1e-6, FMT.money(pa.cra));

// 6) Input hardening — persisted/programmatic state bypasses the UI clamps.
console.log("Hardening:");
const weird = project({ ...cases.A, rrsp: "abc", feePct: -5, gainShare: 500, age: 5, retireAge: 200, retireTax: 400 });
check("non-numeric balance does not produce NaN", Number.isFinite(weird.estate));
check("gainShare clamped to 100%", weird.gainShare === 1, String(weird.gainShare));
check("fee clamped into PAG range", weird.fee === 0.5, String(weird.fee));
check("age clamped into input range", weird.points[0].age === 18, String(weird.points[0].age));
check("retireTax clamped into range", weird.retireTax === 55, String(weird.retireTax));

check("score(null answers) does not throw and scores 0", (() => {
  try { return score(null, { signal: "Low" }).intentionality === 0; } catch { return false; }
})());
check("score with out-of-range answer index does not throw", (() => {
  try { return typeof score({ q1: 9 }, { signal: "Low" }).intentionality === "number"; } catch { return false; }
})());
check("score without projection → signal Low", score({}, undefined).signal === "Low");

// 7) Formatting guards.
console.log("Formatting:");
check("money(NaN) = $0", FMT.money(NaN) === "$0", FMT.money(NaN));
check("money(-1234) = -$1,234", FMT.money(-1234) === "-$1,234", FMT.money(-1234));
check("compact(-2500000) = -$2.5M", FMT.compact(-2500000) === "-$2.5M", FMT.compact(-2500000));
check("compact(999) = $999", FMT.compact(999) === "$999", FMT.compact(999));
check("compact(1e7) = $10M", FMT.compact(1e7) === "$10M", FMT.compact(1e7));
check("pct1(NaN) = 0.0%", FMT.pct1(NaN) === "0.0%", FMT.pct1(NaN));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
