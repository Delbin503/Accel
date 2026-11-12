#!/usr/bin/env node
/**
 * Layer-naming guardrail — run with `npm run lint:slots`.
 *
 * Every design-system component names its layers with `data-slot`, shadcn-style:
 *   root  → kebab-case of the component     (KpiCard → "kpi-card")
 *   parts → "{root}-{part}"                  ("kpi-card-value", "kpi-card-trend")
 *
 * Checks, for component files in src/components/{ui,shared,custom,charts,layout}:
 *   1. The file names at least one layer (unless it renders no DOM of its own).
 *   2. Every data-slot value is kebab-case.
 *   3. Every data-slot value starts with the kebab name of a component declared
 *      in that file — so a layer always says which component it belongs to.
 *      (ui/ is exempt: shadcn's own slot names are kept for compatibility.)
 *   5. Every page / prototype file that renders DOM names its sections.
 *   4. EVERY HTML element (div, span, p, button, input, img…) has a data-slot,
 *      or spreads props/rest so its caller supplies one. SVG internals are exempt.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIRS = ["ui", "shared", "custom", "charts", "layout"].map((d) => join(ROOT, "src/components", d));

// Components that render no DOM of their own (route guards, providers, logic-only).
const NO_DOM = new Set(["RequireRole.tsx", "RequireOnboarding.tsx"]);

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();

const problems = [];
let files = 0;
let slots = 0;

for (const dir of DIRS) {
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".tsx") || name.includes(".stories.") || NO_DOM.has(name)) continue;
    const path = join(dir, name);
    const rel = relative(ROOT, path);
    const src = readFileSync(path, "utf8");
    files++;

    const values = [...src.matchAll(/data-slot=(?:"([^"]+)"|\{\s*["'`]([^"'`$]+)["'`]\s*\})/g)].map((m) => ({
      value: m[1] ?? m[2],
      line: src.slice(0, m.index).split("\n").length,
    }));
    slots += values.length;

    if (values.length === 0) {
      problems.push(`${rel}  names no layers — add data-slot to the root and its parts.`);
      continue;
    }

    // Any component declared in the file (exported or internal helper) may own a slot prefix.
    const exported = [...src.matchAll(/(?:function|const)\s+([A-Z][A-Za-z0-9]*)/g)].map((m) => kebab(m[1]));
    for (const m of src.matchAll(/export\s*\{([^}]+)\}/g))
      for (const n of m[1].split(",")) {
        const id = n.trim().split(/\s+as\s+/).pop();
        if (/^[A-Z]/.test(id ?? "")) exported.push(kebab(id));
      }
    const fileKebab = kebab(name.replace(/\.tsx$/, ""));
    const prefixes = new Set([...exported, fileKebab]);
    const isUi = dir.endsWith("/ui");

    for (const { value, line } of values) {
      if (!KEBAB.test(value)) problems.push(`${rel}:${line}  data-slot="${value}" is not kebab-case.`);
      else if (!isUi && ![...prefixes].some((p) => value === p || value.startsWith(p + "-")))
        problems.push(`${rel}:${line}  data-slot="${value}" doesn't start with a component name from this file (${[...prefixes].join(", ")}).`);
    }
  }
}

// 4. Every HTML element is named. Strip comments first so doc examples don't count.
const HTML = new Set("a abbr address article aside b blockquote button caption code dd details dialog div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr i iframe img input kbd label legend li main mark nav ol optgroup option output p pre progress section select small span strong sub summary sup table tbody td textarea tfoot th thead time tr u ul video".split(" "));
for (const dir of DIRS) {
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".tsx") || name.includes(".stories.") || NO_DOM.has(name)) continue;
    const path = join(dir, name);
    const raw = readFileSync(path, "utf8");
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " ")).replace(/(^|[^:"'`])\/\/.*$/gm, (m, p) => p + " ".repeat(m.length - p.length));
    const tagRe = /<([a-z][a-z0-9]*)\b((?:[^<>{}]|\{(?:[^{}]|\{[^{}]*\})*\})*?)\/?>/g;
    for (const m of src.matchAll(tagRe)) {
      if (!HTML.has(m[1])) continue;
      const attrs = m[2];
      if (/data-slot=/.test(attrs) || /\{\s*\.\.\.\w+\s*\}/.test(attrs)) continue;
      const line = src.slice(0, m.index).split("\n").length;
      problems.push(`${relative(ROOT, path)}:${line}  <${m[1]}> has no data-slot — name it "{component}-{part}".`);
    }
  }
}

// 5. Pages and prototypes name their sections (root "{page}-page" + regions).
// Only files that render their own DOM are checked. Exempt: frozen/dev copies
// and files with in-flight user work (remove from PAGE_EXEMPT once committed).
const PAGE_ROOTS = [join(ROOT, "src/pages"), join(ROOT, "prototypes")];
const PAGE_EXEMPT = [/src\/pages\/dev\//, /src\/pages\/run-analysis\/index\.tsx$/, /prototypes\/PRD_Email_Templates\/index\.tsx$/];
let pageFiles = 0;
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") walk(path); continue; }
    if (!e.name.endsWith(".tsx") || e.name.includes(".stories.")) continue;
    const rel = relative(ROOT, path);
    if (PAGE_EXEMPT.some((re) => re.test(rel))) continue;
    const src = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    if (!/<(div|section|main|header|aside|nav|form|article|ul|span|p)\b/.test(src)) continue; // renders no DOM of its own
    pageFiles++;
    const values = [...src.matchAll(/data-slot=(?:"([^"]+)"|\{\s*["'`]([^"'`$]+)["'`]\s*\})/g)].map((m) => m[1] ?? m[2]);
    if (values.length === 0) problems.push(`${rel}  names no sections — add data-slot="{page}-page" to the root and "{page}-page-{region}" to its main regions.`);
    for (const v of values) if (!KEBAB.test(v)) problems.push(`${rel}  data-slot="${v}" is not kebab-case.`);
  }
}
PAGE_ROOTS.forEach(walk);

if (problems.length) {
  console.error(`Slot check failed — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error("  " + p);
  console.error('\nConvention: root data-slot = kebab-case component name; parts = "{root}-{part}".');
  process.exit(1);
}
console.log(`Slot check passed — ${files} component files, ${slots} named layers; ${pageFiles} page files name their sections.`);
