// Projection model (ported from window.RPG_REAL_RETURN / window.RPG_PROJECT, then
// extended to approximate income tax during decumulation).
// Annual steps, real (today's) dollars, horizon to age 95. Three accounts tracked
// separately; savings/spending applied proportionally to balances.

import { CONTENT } from "./content.js";
import { getProvince } from "./provinces.js";

// Real return per style: gross − fee − inflation (simple subtraction, per spec table).
export function realReturn(styleId, feePct) {
  const CAL = CONTENT.calculator;
  const style = CAL.styles.find((s) => s.id === styleId) || CAL.styles[1];
  const fee = typeof feePct === "number" ? feePct : CAL.feeDefault;
  return { style, fee, real: (style.gross - fee - CAL.inflation) / 100 };
}

export function project(inputs) {
  const CAL = CONTENT.calculator;
  const rr = realReturn(inputs.style, inputs.feePct);
  const r = rr.real;
  const horizon = 95;

  const bal = {
    rrsp: Math.max(0, inputs.rrsp || 0),
    tfsa: Math.max(0, inputs.tfsa || 0),
    nonreg: Math.max(0, inputs.nonreg || 0)
  };
  const keys = ["rrsp", "tfsa", "nonreg"];
  const startTotal = bal.rrsp + bal.tfsa + bal.nonreg;

  function total() {
    return bal.rrsp + bal.tfsa + bal.nonreg;
  }

  // Average income-tax rate applied to the RRSP/RRIF-sourced portion of withdrawals.
  const retireTaxPct =
    typeof inputs.retireTax === "number" ? inputs.retireTax : CAL.retireTaxDefault;
  const retireTaxRate = Math.min(0.95, Math.max(0, retireTaxPct / 100));

  const points = [{ age: inputs.age, w: total() }];
  let depletionAge = null;
  let drawdownTax = 0; // cumulative income tax paid on registered withdrawals (today's $)

  for (let a = inputs.age; a < horizon; a++) {
    keys.forEach((k) => {
      bal[k] *= 1 + r;
    });
    const t = total();

    if (a < inputs.retireAge) {
      // Accumulation: add savings, split proportionally (equal thirds if empty).
      const add = inputs.savings || 0;
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
      const need = inputs.spending || 0;
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
  const gainShare =
    (typeof inputs.gainShare === "number" ? inputs.gainShare : CAL.gainShareDefault) / 100;

  // Tax at death, per account type (upper-bound illustration: top marginal rates,
  // no surviving-spouse rollover). TFSA passes tax-free.
  const rrspTax = bal.rrsp * prov.ord;
  const capTax = bal.nonreg * gainShare * prov.cap;
  const probate = estate > 0 ? prov.probate(estate) : 0;
  const cra = rrspTax + capTax + probate;

  const signal = depletionAge !== null ? "Low" : estate >= startTotal ? "High" : "Building";

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
