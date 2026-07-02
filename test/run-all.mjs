// Runs every suite even if an earlier one fails, then exits nonzero if any failed
// (an `&&` chain would mask the later suite's results when the first one breaks).
import { spawnSync } from "node:child_process";

const suites = ["test/math.test.mjs", "test/api.test.mjs"];
let failed = false;
for (const s of suites) {
  console.log("\n== " + s + " ==");
  const r = spawnSync(process.execPath, [s], { stdio: "inherit" });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
