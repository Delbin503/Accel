#!/usr/bin/env node
/**
 * Component-registry guardrail — run with `npm run lint:components`.
 *
 * src/components/registry.json lists every approved component. A component
 * file that isn't listed fails lint: new components are a deliberate,
 * signed-off decision (CLAUDE.md → "Building page UI"), not a side effect of
 * building a page. Listed files that no longer exist also fail, so the
 * registry stays accurate.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const COMPONENTS = join(ROOT, "src/components");
const registry = JSON.parse(readFileSync(join(COMPONENTS, "registry.json"), "utf8")).components;

const problems = [];
let count = 0;
for (const [folder, listed] of Object.entries(registry)) {
  const actual = readdirSync(join(COMPONENTS, folder))
    .filter((f) => f.endsWith(".tsx") && !f.includes(".stories."))
    .map((f) => f.replace(/\.tsx$/, ""));
  count += actual.length;
  for (const name of actual)
    if (!listed.includes(name))
      problems.push(`src/components/${folder}/${name}.tsx is not in the registry. New components need sign-off first — ask, then add it to src/components/registry.json (with data-slot names and a story).`);
  for (const name of listed)
    if (!actual.includes(name)) problems.push(`registry.json lists ${folder}/${name}, but the file doesn't exist — remove the entry.`);
}
for (const folder of readdirSync(COMPONENTS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name))
  if (!(folder in registry)) problems.push(`src/components/${folder}/ is a new component folder — ask before adding one, then register it.`);

if (problems.length) {
  console.error(`Component registry check failed — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log(`Component registry check passed — ${count} approved components.`);
