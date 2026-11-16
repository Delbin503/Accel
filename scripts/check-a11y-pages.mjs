#!/usr/bin/env node
/**
 * Accessibility gate for the real pages — axe over every prototype page
 * (the prototypes render the app's pages) in light AND dark.
 *
 *   npm run test:a11y:pages          (builds the prototypes first)
 *   node scripts/check-a11y-pages.mjs [dist-prototypes] [page-filter]
 *
 * - Serves the static prototype build itself (no dev server in CI).
 * - Every folder in the build with an index.html is a page.
 * - Excludes the prototype "dev state" tester panels (data-slot="tester-shell…"),
 *   which are review tooling, not product UI.
 * - Chrome: CHROME_PATH, else the usual macOS / Linux locations.
 * - Exits 1 on any violation; writes .ds-ops-reports/a11y-pages-<date>.json.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.resolve(ROOT, process.argv[2] ?? "dist-prototypes");
const FILTER = process.argv[3];
const AXE = fs.readFileSync(path.join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
const EXCLUDE = ["[data-slot^=tester-shell]"];

const chrome = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
].filter(Boolean).find((p) => fs.existsSync(p));

if (!fs.existsSync(DIST)) {
  console.error(`No prototype build at ${DIST} — run \`npm run test:a11y:pages\` (it builds first).`);
  process.exit(2);
}
if (!chrome) {
  console.error("No Chrome/Chromium found — set CHROME_PATH.");
  process.exit(2);
}

let pages = fs
  .readdirSync(DIST, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(DIST, d.name, "index.html")))
  .map((d) => d.name)
  .sort();
if (FILTER) pages = pages.filter((p) => p.includes(FILTER));

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".woff2": "font/woff2", ".woff": "font/woff" };
const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  if (url.endsWith("/")) url += "index.html";
  const file = path.join(DIST, url);
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const results = [];
for (const theme of ["dark", "light"]) {
  for (const name of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    try {
      await page.goto(`${BASE}/${name}/`, { waitUntil: "networkidle0", timeout: 30000 });
      await page.evaluate((t) => {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(t);
      }, theme);
      await new Promise((r) => setTimeout(r, 1000)); // let theme transitions settle
      await page.evaluate(AXE);
      const res = await page.evaluate(
        (exclude) => window.axe.run({ include: [document], exclude: exclude.map((s) => [s]) }, { resultTypes: ["violations"] }),
        EXCLUDE
      );
      for (const v of res.violations)
        results.push({
          theme, page: name, rule: v.id, impact: v.impact, n: v.nodes.length,
          nodes: v.nodes.slice(0, 5).map((n) => ({ target: n.target.join(" "), summary: (n.failureSummary ?? "").replace(/\s+/g, " ").slice(0, 220) })),
        });
    } catch (e) {
      results.push({ theme, page: name, rule: "runner-error", n: 1, nodes: [{ summary: String(e).slice(0, 220) }] });
    }
    await page.close();
  }
}
await browser.close();
server.close();

const outDir = path.join(ROOT, ".ds-ops-reports");
fs.mkdirSync(outDir, { recursive: true });
const report = path.join(outDir, `a11y-pages-${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(report, JSON.stringify({ pages, results }, null, 1));

const total = results.reduce((a, r) => a + r.n, 0);
if (total === 0) {
  console.log(`Page a11y check passed — ${pages.length} pages × light/dark, 0 violations.`);
  process.exit(0);
}
console.error(`Page a11y check failed — ${total} element(s) across ${pages.length} pages × light/dark:\n`);
for (const r of results) {
  console.error(`  [${r.theme}] ${r.page} — ${r.rule}${r.impact ? ` (${r.impact})` : ""} ×${r.n}`);
  for (const n of r.nodes) console.error(`      ${n.target ?? ""} ${n.summary}`);
}
console.error(`\nFull report: ${path.relative(ROOT, report)}.`);
process.exit(1);
