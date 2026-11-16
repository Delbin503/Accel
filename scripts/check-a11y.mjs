#!/usr/bin/env node
/**
 * Accessibility gate — runs axe over every Storybook story in light AND dark.
 * Run with `npm run test:a11y` (builds Storybook first) or, against an
 * existing build, `node scripts/check-a11y.mjs [storybook-static] [id-filter]`.
 *
 * - Serves the static Storybook build itself (no dev server needed in CI).
 * - Honours per-story `parameters.a11y.config.rules` (documented exceptions).
 * - Chrome: set CHROME_PATH, otherwise the usual macOS / Linux locations.
 * - Exits 1 when any story × theme has a violation; writes a JSON report to
 *   .ds-ops-reports/a11y-<date>.json.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATIC = path.resolve(ROOT, process.argv[2] ?? "storybook-static");
const FILTER = process.argv[3];
const CONCURRENCY = Number(process.env.A11Y_CONCURRENCY ?? 4);
const AXE = fs.readFileSync(path.join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
// Page-level rules that don't apply to isolated component stories.
const GLOBAL_OFF = ["region", "landmark-one-main", "page-has-heading-one"];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
].filter(Boolean);
const chrome = CHROME_CANDIDATES.find((p) => fs.existsSync(p));

if (!fs.existsSync(path.join(STATIC, "index.json"))) {
  console.error(`No Storybook build at ${STATIC} — run \`npm run build-storybook\` first.`);
  process.exit(2);
}
if (!chrome) {
  console.error("No Chrome/Chromium found — set CHROME_PATH.");
  process.exit(2);
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".mp4": "video/mp4", ".gif": "image/gif", ".jpg": "image/jpeg", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  let file = path.join(STATIC, url === "/" ? "index.html" : url);
  if (!file.startsWith(STATIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const index = JSON.parse(fs.readFileSync(path.join(STATIC, "index.json"), "utf8"));
let ids = Object.values(index.entries).filter((e) => e.type === "story").map((e) => e.id);
if (FILTER) ids = ids.filter((id) => id.includes(FILTER));
const jobs = ["dark", "light"].flatMap((theme) => ids.map((id) => [theme, id]));

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const results = [];
let next = 0;
async function worker() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });
  while (next < jobs.length) {
    const [theme, id] = jobs[next++];
    try {
      await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, { waitUntil: "networkidle0", timeout: 30000 });
      await page.waitForFunction(() => document.querySelector("#storybook-root")?.childElementCount || document.querySelector("[role=dialog]"), { timeout: 10000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 600)); // let enter transitions settle
      await page.evaluate(AXE);
      const res = await page.evaluate(
        async (storyId, off) => {
          const rules = Object.fromEntries(off.map((r) => [r, { enabled: false }]));
          try {
            const story = await window.__STORYBOOK_PREVIEW__.storyStoreValue.loadStory({ storyId });
            for (const r of story.parameters?.a11y?.config?.rules ?? []) rules[r.id] = { enabled: r.enabled };
          } catch {
            /* story params unavailable — run with defaults */
          }
          const errorShown = document.body.classList.contains("sb-show-errordisplay");
          const out = await window.axe.run(document, { resultTypes: ["violations"], rules });
          return { errorShown, violations: out.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => ({ target: n.target.join(" "), summary: (n.failureSummary ?? "").replace(/\s+/g, " ").slice(0, 220) })) })) };
        },
        id,
        GLOBAL_OFF
      );
      if (res.errorShown) results.push({ theme, id, rule: "render-error", nodes: [] });
      for (const v of res.violations) results.push({ theme, id, rule: v.id, impact: v.impact, nodes: v.nodes });
    } catch (e) {
      results.push({ theme, id, rule: "runner-error", nodes: [{ summary: String(e).slice(0, 220) }] });
    }
  }
  await page.close();
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await browser.close();
server.close();

const outDir = path.join(ROOT, ".ds-ops-reports");
fs.mkdirSync(outDir, { recursive: true });
const report = path.join(outDir, `a11y-${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(report, JSON.stringify({ stories: ids.length, themes: 2, results }, null, 1));

if (results.length === 0) {
  console.log(`A11y check passed — ${ids.length} stories × light/dark, 0 violations.`);
  process.exit(0);
}
console.error(`A11y check failed — ${results.length} violation(s) across ${ids.length} stories × light/dark:\n`);
for (const r of results) {
  console.error(`  [${r.theme}] ${r.id} — ${r.rule}${r.impact ? ` (${r.impact})` : ""}`);
  for (const n of r.nodes) console.error(`      ${n.target ?? ""} ${n.summary}`);
}
console.error(`\nFull report: ${path.relative(ROOT, report)}. A documented exception goes in the story's parameters.a11y.config.rules with a comment saying why.`);
process.exit(1);
