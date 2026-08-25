#!/usr/bin/env node
// Lints a transactional email template against the hard rules in SKILL.md.
// Usage: node check-email.mjs <file.html> [more.html ...]
// Exit 1 if any ERROR is found. Warnings never fail the run.

import { readFileSync, existsSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const GMAIL_CLIP_BYTES = 92 * 1024;

/** Strip HTML comments so conditional/VML blocks don't produce false hits. */
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "");

/** Line number of a match index. */
const lineOf = (src, index) => src.slice(0, index).split("\n").length;

function check(file) {
  const raw = readFileSync(file, "utf8");
  const src = stripComments(raw);
  const bytes = statSync(file).size;
  const errors = [];
  const warnings = [];

  const err = (msg, i) => errors.push(i == null ? msg : `${msg} (line ${lineOf(raw, i)})`);
  const warn = (msg, i) => warnings.push(i == null ? msg : `${msg} (line ${lineOf(raw, i)})`);

  const all = (re) => [...src.matchAll(re)];

  // ---- Errors: these break real clients -------------------------------------

  for (const m of all(/<script[\s>]/gi)) err("<script> is stripped by every client and flags spam filters", m.index);

  // A hosted webfont <link> is the one legitimate external stylesheet: Apple Mail
  // and iOS honor it, everyone else silently ignores it and uses the fallback stack.
  for (const m of all(/<link[^>]+stylesheet[^>]*>/gi)) {
    if (/fonts\.(googleapis|gstatic)\.com|use\.typekit\.net/i.test(m[0])) {
      warn("Webfont <link> only applies in Apple Mail/iOS — confirm the fallback font stack is on every element", m.index);
    } else {
      err("External stylesheet <link> will not load; inline the styles", m.index);
    }
  }

  for (const m of all(/<(form|input|button|select|textarea)[\s>]/gi))
    err(`<${m[1]}> is unsupported or stripped; use a linked <a> instead`, m.index);

  for (const m of all(/var\(--[\w-]+\)/g))
    err("CSS variable will not resolve in Outlook/Yahoo; use a literal hex from TOKENS.md", m.index);

  for (const m of all(/display\s*:\s*(flex|grid|inline-flex|inline-grid)/gi))
    err(`display:${m[1]} is not supported by the Outlook Word engine; use nested tables`, m.index);

  for (const m of all(/position\s*:\s*(absolute|fixed|sticky)/gi))
    err(`position:${m[1]} is unsupported in email; use table cells and padding`, m.index);

  for (const m of all(/\bclass(Name)?=["'][^"']*\b(flex|grid|p[xytblr]?-\d|text-(xs|sm|base|lg|xl)|bg-(card|background|muted)|rounded-)/g))
    err("Tailwind/app class detected — email templates cannot use the app stylesheet", m.index);

  for (const m of all(/font-size\s*:\s*(\d+(?:\.\d+)?)px/gi)) {
    if (parseFloat(m[1]) < 12 && parseFloat(m[1]) > 2) {
      err(`font-size:${m[1]}px is below the 12px floor; Gmail Android will resize it and break the layout`, m.index);
    }
  }

  for (const m of all(/<img\b(?![^>]*\balt=)[^>]*>/gi)) err("<img> is missing alt text", m.index);

  for (const m of all(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
    const url = m[1];
    if (!/^(https:|data:|cid:|\{\{)/i.test(url)) {
      err(`Image src "${url}" is not an absolute https URL; it will not load in any inbox`, m.index);
    }
  }

  if (!/role=["']presentation["']/i.test(src))
    err('No <table role="presentation"> found — layout must be table-based, and tables need the ARIA role to stay out of the a11y tree');

  // ---- Warnings: degrade quality, not correctness ---------------------------

  if (bytes > GMAIL_CLIP_BYTES)
    warn(`File is ${(bytes / 1024).toFixed(1)}KB; Gmail clips messages past ~102KB and hides the footer`);

  if (!/name=["']color-scheme["']/i.test(src)) warn('Missing <meta name="color-scheme" content="light dark">');

  // A template that declares light-only is making a deliberate choice; only nag
  // the ones that claim dark support and then don't ship a dark block.
  const lightOnly = /content=["']light["']/i.test(src) && !/content=["'][^"']*dark/i.test(src);
  if (!/prefers-color-scheme\s*:\s*dark/i.test(src) && !lightOnly)
    warn("No dark-mode media query — honoring clients will render the light palette");
  if (lightOnly && !/\[data-ogs[bc]\]/i.test(src))
    warn("Light-only template with no [data-ogsc]/[data-ogsb] overrides — Outlook.com will force-invert it anyway");

  if (!/mso-hide\s*:\s*all/i.test(src))
    warn("No preheader block found; clients will scrape your first visible line for the inbox preview");

  for (const m of all(/background-image\s*:/gi)) warn("background-image is dropped by Outlook Windows; ensure a bgcolor fallback", m.index);

  for (const m of all(/margin\s*:\s*(0\s+)?auto/gi)) warn("margin:auto is dropped by Outlook; center with <td align=\"center\">", m.index);

  for (const m of all(/font-size\s*:\s*[\d.]+(rem|em)\b/gi)) warn(`font-size in ${m[1]} resolves unpredictably in Outlook; use px`, m.index);

  for (const m of all(/font-size\s*:\s*\d+px\s*;(?![^;{}]*line-height)/gi)) {
    const decl = src.slice(m.index, m.index + 260);
    if (!/line-height/i.test(decl)) warn("font-size without an adjacent line-height; Outlook picks its own leading", m.index);
  }

  // Rules in <style> that aren't inside @media won't survive Gmail's forward/POP path.
  const styleBlocks = all(/<style[^>]*>([\s\S]*?)<\/style>/gi).map((m) => m[1]);
  // [data-ogsc]/[data-ogsb] are Outlook.com's forced-dark hooks — they exist only
  // as head selectors and cannot be inlined, so they are never a finding.
  const RESET_OK = /^(:root|body|html|table|td|a|img|p|h[1-6]|\*|\.ExternalClass|#outlook|\[data-ogs[bc]\])/;
  for (const block of styleBlocks) {
    const outsideMedia = block
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");
    for (const m of outsideMedia.matchAll(/(^|\})\s*([^{}@]+)\{/g)) {
      const sel = m[2].trim().replace(/\s+/g, " ");
      if (sel && !RESET_OK.test(sel)) {
        warn(`Selector "${sel}" is only in <style>; Gmail strips <head> on forward — inline it`);
      }
    }
  }

  // Plain-text twin
  const txt = join(dirname(file), basename(file).replace(/\.html?$/i, ".txt"));
  if (!existsSync(txt)) warn(`No plain-text twin at ${basename(txt)} — required for deliverability`);

  // Content width — only the declarations, not @media query conditions.
  const noMediaConditions = src.replace(/@media[^{]*\{/g, "{");
  for (const m of noMediaConditions.matchAll(/max-width\s*:\s*(\d+)px/gi)) {
    if (parseInt(m[1], 10) > 600) warn(`max-width:${m[1]}px exceeds the 600px safe ceiling`);
  }

  return { errors, warnings };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node check-email.mjs <file.html> [...]");
  process.exit(2);
}

let failed = false;
for (const file of files) {
  if (!existsSync(file)) {
    console.error(`\x1b[31m✗\x1b[0m ${file} — not found`);
    failed = true;
    continue;
  }
  const { errors, warnings } = check(file);
  const mark = errors.length ? "\x1b[31m✗\x1b[0m" : warnings.length ? "\x1b[33m!\x1b[0m" : "\x1b[32m✓\x1b[0m";
  console.log(`\n${mark} ${file}`);
  for (const e of errors) console.log(`  \x1b[31mERROR\x1b[0m  ${e}`);
  for (const w of warnings) console.log(`  \x1b[33mwarn\x1b[0m   ${w}`);
  if (!errors.length && !warnings.length) console.log("  clean");
  if (errors.length) failed = true;
}

console.log("");
process.exit(failed ? 1 : 0);
