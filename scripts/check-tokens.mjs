#!/usr/bin/env node
/**
 * Token guardrail for packages/ui/src/styles.css — run with `npm run lint:tokens`.
 *
 * Enforces the naming and tier rules written in the index.css header:
 *   1. Every custom property is kebab-case.
 *   2. Primitives (--palette-{hue}-{step}) live only in the primitives block,
 *      and that block holds nothing else.
 *   3. .dark overrides existing semantic tokens only — never primitives,
 *      never a token that :root doesn't define.
 *   4. Every var(--x) in the file points at a token that exists.
 *
 * Exits 1 with a list of problems, so it can gate CI alongside ESLint.
 * Optional argument: a CSS file path (defaults to packages/ui/src/styles.css).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { relative } from "node:path";

const FILE = process.argv[2] ?? fileURLToPath(new URL("../packages/ui/src/styles.css", import.meta.url));
const css = readFileSync(FILE, "utf8");

// Variables provided by Tailwind/libraries at runtime, not declared here.
const EXTERNAL = [/^--tw-/, /^--spacing$/, /^--default-/];

const KEBAB = /^--[a-z0-9]+(-[a-z0-9]+)*(--line-height)?$/;
const PRIMITIVE = /^--palette-[a-z]+-[0-9]+$/;

/** Top-level blocks: { selector, startLine, decls: [{name, line}], refs: [{name, line}] } */
function parseBlocks(source) {
  const blocks = [];
  let depth = 0;
  let current = null;
  let pendingSelector = "";
  const lines = source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " ")).split("\n");
  lines.forEach((text, i) => {
    const line = i + 1;
    for (const ch of text) {
      if (ch === "{") {
        if (depth === 0) {
          current = { selector: pendingSelector.trim(), startLine: line, decls: [], refs: [] };
          blocks.push(current);
        }
        depth++;
        pendingSelector = "";
      } else if (ch === "}") {
        depth--;
        if (depth === 0) current = null;
      } else if (depth === 0) {
        pendingSelector += ch;
      }
    }
    if (current) {
      const decl = text.match(/^\s*(--[A-Za-z0-9_-]+)\s*:/);
      if (decl) current.decls.push({ name: decl[1], line });
      for (const m of text.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) current.refs.push({ name: m[1], line });
    }
    if (depth === 0 && !text.includes("{")) pendingSelector += "\n";
  });
  return blocks;
}

const blocks = parseBlocks(css);
const problems = [];
const LABEL = relative(process.cwd(), FILE);
const fail = (line, msg) => problems.push(`${LABEL}:${line}  ${msg}`);

// The primitives block is the first :root after the "1. Primitives" marker.
const markerLine = css.split("\n").findIndex((l) => l.includes("1. Primitives")) + 1;
const primitivesBlock = blocks.find((b) => b.selector === ":root" && b.startLine > markerLine);
if (!markerLine || !primitivesBlock) fail(1, 'Could not find the "1. Primitives" :root block.');

const defined = new Set(blocks.flatMap((b) => b.decls.map((d) => d.name)));
const rootDefined = new Set(blocks.filter((b) => b.selector === ":root").flatMap((b) => b.decls.map((d) => d.name)));

for (const block of blocks) {
  const isPrimitives = block === primitivesBlock;
  const isDark = block.selector === ".dark";
  for (const { name, line } of block.decls) {
    if (!KEBAB.test(name)) fail(line, `${name} is not kebab-case.`);
    if (isPrimitives && !PRIMITIVE.test(name))
      fail(line, `${name} is in the primitives block but isn't --palette-{hue}-{step}.`);
    if (!isPrimitives && name.startsWith("--palette-"))
      fail(line, `${name} is a primitive declared outside the primitives block${isDark ? " (.dark must not override primitives)" : ""}.`);
    if (isDark && !name.startsWith("--palette-") && !rootDefined.has(name))
      fail(line, `.dark defines ${name}, which :root doesn't — every themed token needs a base value.`);
  }
  for (const { name, line } of block.refs) {
    if (!defined.has(name) && !EXTERNAL.some((re) => re.test(name)))
      fail(line, `var(${name}) points at a token that isn't defined.`);
  }
}

if (problems.length) {
  console.error(`Token check failed — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error("  " + p);
  console.error("\nRules: see the naming/tier header in packages/ui/src/styles.css.");
  process.exit(1);
}
const count = defined.size;
console.log(`Token check passed — ${count} tokens, ${primitivesBlock.decls.length} primitives.`);
