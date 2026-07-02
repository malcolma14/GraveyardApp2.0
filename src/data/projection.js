// Projection model (ported from window.RPG_REAL_RETURN / window.RPG_PROJECT, then
// extended to approximate income tax during decumulation).
// Annual steps, real (today's) dollars, horizon to age 95. Three accounts tracked
// separately; savings/spending applied proportionally to balances.

import { CONTENT } from "./content.js";
import { getProvince } from "./provinces.js";

// Inputs normally arrive clamped by the UI steppers, but persisted or programmatic
// state bypasses that — so the engine re-clamps everything it consumes.
function toNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// Real return per style: gross − fee − inflation (simple subtraction, per spec table).
export function realReturn(styleId, feePct) {
  const CAL = CONTENT.calculator;
  const style = CAL.styles.find((s) => s.id === styleId) || CAL.styles[1];
  const fee = clamp(toNum(feePct, CAL.feeDefault), CAL.feeRange.min, CAL.feeRange.max);
  return { style, fee, real: (style.gross - fee - CAL.inflation) / 100 };
}

export function project(inputs) {
  const CAL = CONTENT.calculator;
  const rr = realReturn(inputs.style, inputs.feePct);
  const r = rr.real;
  const horizon = 95;

  const defs = {};
  CAL.inputs.forEach((d) => {
    defs[d.id] = d;
  });
  const age = Math.round(clamp(toNum(inputs.age, CAL.defaults.age), defs.age.min, defs.age.max));
  const retireAge = Math.round(
    clamp(toNum(inputs.retireAge, CAL.defaults.retireAge), defs.retireAge.min, defs.retireAge.max)
  );
  const savings = Math.max(0, toNum(inputs.savings, 0));
  const spending = Math.max(0, toNum(inputs.spending, 0));

  const bal = {
    rrsp: Math.max(0, toNum(inputs.rrsp, 0)),
    tfsa: Math.max(0, toNum(inputs.tfsa, 0)),
    nonreg: Math.max(0, toNum(inputs.nonreg, 0))
  };
  const keys = ["rrsp", "tfsa", "nonreg"];
  const startTotal = bal.rrsp + bal.tfsa + bal.nonreg;

  function total() {
    return bal.rrsp + bal.tfsa + bal.nonreg;
  }

  // Average income-tax rate applied to the RRSP/RRIF-sourced portion of withdrawals.
  const retireTaxPct = clamp(
    toNum(inputs.retireTax, CAL.retireTaxDefault),
    CAL.retireTaxRange.min,
    CAL.retireTaxRange.max
  );
  const retireTaxRate = Math.min(0.95, Math.max(0, retireTaxPct / 100));

  const points = [{ age, w: total() }];
  let depletionAge = null;
  let drawdownTax = 0; // cumulative income tax paid on registered withdrawals (today's $)

  for (let a = age; a < horizon; a++) {
    keys.forEach((k) => {
      bal[k] *= 1 + r;
    });
    const t = total();

    if (a < retireAge) {
      // Accumulation: add savings, split proportionally (equal thirds if empty).
      const add = savings;
      if (add > 0) {
        if (t <= 0) keys.forEach((k) => { bal[k] += add / 3; });
        else keys.forEach((k) => { bal[k] += add * (bal[k] / t); });
      }
    } else {
      // Decumulation: withdraw enough to NET `spending` after income tax on the
      // RRSP/RRIF-sourced portion of the draw. To net `need` when a fraction
      // (rrsp/t) of the gross withdrawal is taxable at retireTaxRate, the gross
      // withdrawal is need / (1 − (rrsp/t)·rate). TFSA and non-registered
      // withdrawals are treated as tax-free in life (non-registered gains are
      // still estimated at death).
      const need = spending;
      if (need > 0) {
        if (t <= 0) {
          if (depletionAge === null) depletionAge = a + 1;
        } else {
          const effTax = (bal.rrsp / t) * retireTaxRate;
          const gross = need / (1 - effTax);
          if (gross >= t) {
            // Portfolio can't fund the full year — exhausted this year.
            drawdownTax += bal.rrsp * retireTaxRate; // tax on liquidating the registered remainder
            keys.forEach((k) => { bal[k] = 0; });
            if (depletionAge === null) depletionAge = a + 1;
          } else {
            drawdownTax += gross - need; // == gross · effTax
            keys.forEach((k) => { bal[k] -= gross * (bal[k] / t); });
          }
        }
      }
    }
    points.push({ age: a + 1, w: total() });
  }

  const estate = total();
  const prov = getProvince(inputs.province);
  const gainShare = clamp(toNum(inputs.gainShare, CAL.gainShareDefault), 0, 100) / 100;

  // Tax at death, per account type (upper-bound illustration: top marginal rates,
  // no surviving-spouse rollover). TFSA passes tax-free.
  const rrspTax = bal.rrsp * prov.ord;
  const capTax = bal.nonreg * gainShare * prov.cap;
  const probate = estate > 0 ? prov.probate(estate) : 0;
  const cra = rrspTax + capTax + probate;

  // "High" requires a real estate — an all-zero portfolio must not read as surplus.
  const signal =
    depletionAge !== null ? "Low" : estate > 0 && estate >= startTotal ? "High" : "Building";

  return {
    points,
    estate,
    cra,
    depletionAge,
    signal,
    drawdownTax,
    endBalances: { rrsp: bal.rrsp, tfsa: bal.tfsa, nonreg: bal.nonreg },
    breakdown: { rrspTax, capTax, probate },
    province: prov,
    gainShare,
    retireTax: retireTaxPct,
    styleName: rr.style.name,
    styleMix: rr.style.mix,
    gross: rr.style.gross,
    fee: rr.fee,
    inflation: CAL.inflation,
    realReturn: r
  };
}

export default project;
