// Money / percentage formatting (ported from window.RPG_FMT).

export const FMT = {
  money: (n) => "$" + Math.round(n).toLocaleString("en-CA"),
  moneyRough: (n) => "$" + (Math.round(n / 10000) * 10000).toLocaleString("en-CA"),
  compact: (n) => {
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
    return "$" + Math.round(n);
  },
  pct1: (n) => n.toFixed(1) + "%",
  pct2: (n) => (n * 100).toFixed(2) + "%"
};

export default FMT;
