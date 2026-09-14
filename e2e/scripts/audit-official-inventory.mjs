import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const OFFICIAL_FIRST = 1;
const OFFICIAL_LAST = 244;
const MANUAL_IDS = new Set([20, 28]);
const specsRoot = resolve(process.cwd(), "e2e/specs");

function collectSpecs(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) return collectSpecs(path);
    return entry.isFile() && entry.name.endsWith(".spec.ts") ? [path] : [];
  });
}

const occurrences = new Map();
const titlePattern = /\btest\s*\(\s*["'`]TC-BB(\d+)\b/g;

for (const spec of collectSpecs(specsRoot)) {
  const source = readFileSync(spec, "utf8");
  for (const match of source.matchAll(titlePattern)) {
    const id = `TC-BB${match[1]}`;
    const locations = occurrences.get(id) ?? [];
    locations.push(relative(process.cwd(), spec));
    occurrences.set(id, locations);
  }
}

const expected = Array.from(
  { length: OFFICIAL_LAST - OFFICIAL_FIRST + 1 },
  (_, index) => index + OFFICIAL_FIRST,
).filter((number) => !MANUAL_IDS.has(number));
const expectedIds = new Set(
  expected.map((number) => `TC-BB${String(number).padStart(3, "0")}`),
);
const duplicates = [...occurrences.entries()].filter(
  ([, locations]) => locations.length > 1,
);
const missing = [...expectedIds].filter((id) => !occurrences.has(id));
const unexpected = [...occurrences.keys()].filter((id) => !expectedIds.has(id));

console.log(`Automated official IDs found: ${occurrences.size}`);
console.log(`Expected automated official IDs: ${expectedIds.size}`);
console.log(`Manual/SPECIAL_ENV IDs: TC-BB020, TC-BB028`);
console.log(`Duplicates: ${duplicates.length}`);
console.log(`Missing: ${missing.length}`);
console.log(`Unexpected/manual/out-of-range: ${unexpected.length}`);

for (const [id, locations] of duplicates) {
  console.error(`Duplicate ${id}: ${locations.join(", ")}`);
}
for (const id of missing) console.error(`Missing ${id}`);
for (const id of unexpected) {
  console.error(`Unexpected ${id}: ${occurrences.get(id)?.join(", ")}`);
}

if (
  occurrences.size !== expectedIds.size ||
  duplicates.length > 0 ||
  missing.length > 0 ||
  unexpected.length > 0
) {
  process.exitCode = 1;
}
