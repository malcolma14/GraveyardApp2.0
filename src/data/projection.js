// Projection model (ported verbatim from window.RPG_REAL_RETURN / window.RPG_PROJECT).
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

  const points = [{ age: inputs.age, w: total() }];
  let depletionAge = null;

  for (let a = inputs.age; a < horizon; a++) {
    keys.forEach((k) => {
      bal[k] *= 1 + r;
    });
    const flow = a < inputs.retireAge ? inputs.savings || 0 : -(inputs.spending || 0);
    const t = total();
    if (flow >= 0) {
      if (t <= 0) {
        keys.forEach((k) => {
          bal[k] += flow / 3;
        });
      } else {
        keys.forEach((k) => {
          bal[k] += flow * (bal[k] / t);
        });
      }
    } else {
      if (t + flow <= 0) {
        keys.forEach((k) => {
          bal[k] = 0;
        });
        if (depletionAge === null) depletionAge = a + 1;
      } else {
        keys.forEach((k) => {
          bal[k] += flow * (bal[k] / t);
        });
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
    endBalances: { rrsp: bal.rrsp, tfsa: bal.tfsa, nonreg: bal.nonreg },
    breakdown: { rrspTax, capTax, probate },
    province: prov,
    gainShare,
    styleName: rr.style.name,
    styleMix: rr.style.mix,
    gross: rr.style.gross,
    fee: rr.fee,
    inflation: CAL.inflation,
    realReturn: r
  };
}

export default project;
