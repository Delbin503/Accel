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
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
// Design-system folders live in the @accel/ui package; app/ stays in the app.
const APP_COMPONENTS = join(ROOT, "src/components");
const DS_COMPONENTS = join(ROOT, "packages/ui/src/components");
const dirOf = (folder) => join(folder === "app" ? APP_COMPONENTS : DS_COMPONENTS, folder);
const shown = (folder) => (folder === "app" ? "src/components" : "packages/ui/src/components");
const registry = JSON.parse(readFileSync(join(APP_COMPONENTS, "registry.json"), "utf8")).components;

const problems = [];
let count = 0;
for (const [folder, listed] of Object.entries(registry)) {
  const actual = readdirSync(dirOf(folder))
    .filter((f) => f.endsWith(".tsx") && !f.includes(".stories."))
    .map((f) => f.replace(/\.tsx$/, ""));
  count += actual.length;
  for (const name of actual)
    if (!listed.includes(name))
      problems.push(`${shown(folder)}/${folder}/${name}.tsx is not in the registry. New components need sign-off first — ask, then add it to src/components/registry.json (with data-slot names and a story).`);
  for (const name of listed)
    if (!actual.includes(name)) problems.push(`registry.json lists ${folder}/${name}, but the file doesn't exist — remove the entry.`);
}
for (const base of [APP_COMPONENTS, DS_COMPONENTS])
  for (const folder of readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name))
    if (!(folder in registry)) problems.push(`${relative(ROOT, base)}/${folder}/ is a new component folder — ask before adding one, then register it.`);

if (problems.length) {
  console.error(`Component registry check failed — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log(`Component registry check passed — ${count} approved components.`);
