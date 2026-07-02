// Money / percentage formatting (ported from window.RPG_FMT).
// Non-finite values render as 0 rather than "$NaN"; negatives put the sign before the $.

const safe = (n) => (Number.isFinite(n) ? n : 0);

export const FMT = {
  money: (n) => {
    const v = Math.round(safe(n));
    return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-CA");
  },
  moneyRough: (n) => {
    const v = Math.round(safe(n) / 10000) * 10000;
    return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-CA");
  },
  compact: (n) => {
    const s = safe(n) < 0 ? "-" : "";
    const v = Math.abs(safe(n));
    if (v >= 1e6) return s + "$" + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (v >= 1e3) return s + "$" + Math.round(v / 1e3) + "K";
    return s + "$" + Math.round(v);
  },
  pct1: (n) => safe(n).toFixed(1) + "%",
  pct2: (n) => (safe(n) * 100).toFixed(2) + "%"
};

export default FMT;
