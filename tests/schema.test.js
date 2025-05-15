const { spawnSync } = require("child_process");
const path = require("path");

const bin = path.resolve(__dirname, "../src/bin/index.js");

const bad = spawnSync("node", [bin, "sync",
  "--issues", "tests/invalid-issues.yaml",
  "--milestones", "tests/valid-ms.yaml",
  "--repo", "dummy/dummy"
]);

if (bad.status === 1) {
  console.log("✅ schema validation failed as expected");
  process.exit(0);
}
console.error("❌ validation did not fail");
process.exit(1);