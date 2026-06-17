import fs from "node:fs";
import path from "node:path";

const activePlansDir = path.resolve("docs/codex-tasks/plans/pending/active");
const requiredSections = [
  "Status:",
  "## Elkeszult reszek",
  "## Nyitott reszek",
];

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(activePlansDir)) {
  fail(`Missing active plans directory: ${activePlansDir}`);
}

const files = fs
  .readdirSync(activePlansDir)
  .filter((file) => file.endsWith(".md"))
  .sort();

for (const file of files) {
  const fullPath = path.join(activePlansDir, file);
  const content = fs.readFileSync(fullPath, "utf8");
  const missing = requiredSections.filter((section) => !content.includes(section));
  if (missing.length > 0) {
    fail(`${file} is missing required plan section(s): ${missing.join(", ")}`);
  }
}

console.log(`Checked ${files.length} active plan file(s).`);
