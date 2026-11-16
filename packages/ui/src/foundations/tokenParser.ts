/**
 * Parses src/index.css into structured token data for the Storybook
 * Token Reference (Foundations/Token Reference). Pure — no DOM, no Vite — so
 * it can also run under Node for checks. tokenData.ts feeds it the raw file.
 *
 * Deliberately simple: a line scanner that tracks top-level blocks
 * (`@theme`, `:root`, `.dark`, `@utility`), comments and declarations. It
 * never throws on unknown tokens — anything it can't classify still lands in
 * the output with a best-effort tier and group.
 */

export type TokenTier =
  /** --palette-{hue}-{step} — raw values, index.css only. */
  | "primitive"
  /** Roles: surfaces, brand, feedback, severity, media… (themed). */
  | "semantic"
  /** --sidebar-*, --chart-* — component-scoped roles. */
  | "component"
  /** --text-*, --z-*, --duration-*, --ease-*, --elevation-*, --radius*, --font-*. */
  | "scale"
  /** @theme --color-* / --shadow-* — maps a CSS var onto a Tailwind utility. */
  | "bridge";

export interface Token {
  /** Custom property name, e.g. `--success`. */
  name: string;
  tier: TokenTier;
  /** Scale category (`text`, `z`, `duration`, `ease`, `elevation`, `radius`, `font`) or "" for non-scales. */
  category: string;
  /** Section heading comment the token sits under (e.g. "Surfaces", "Severity"). */
  group: string;
  /** Block it is declared in first: "@theme", ":root" or ".dark". */
  block: string;
  /** 1-based line in index.css. */
  line: number;
  /** Base (light) value — :root, or @theme for theme-layer tokens. */
  light: string | undefined;
  /** .dark override, or undefined when the token is identical in dark. */
  dark: string | undefined;
  /** Light/dark value with every var() resolved to a literal where possible. */
  resolvedLight: string | undefined;
  resolvedDark: string | undefined;
  /** Trailing comment on the declaration line. */
  comment: string | undefined;
  /** Explanatory (non-heading) comment directly above a run of declarations. */
  note: string | undefined;
  deprecated: boolean;
  /** Where the deprecation came from — the comment text. */
  deprecationNote: string | undefined;
  /** Suggested replacement: a token (`--severity-critical`) or a utility (`bg-success/15`). */
  replacement: string | undefined;
  /** Tailwind / CSS usage — e.g. `bg-success`, `shadow-raised`, `z-[var(--z-modal)]`. */
  utilities: string[];
  /** True when the resolved value is a colour. */
  isColor: boolean;
  /** Tokens whose value references this one. */
  usedBy: string[];
}

export interface TokenData {
  tokens: Token[];
  byName: Map<string, Token>;
  /** Unique token count per tier. */
  counts: Record<TokenTier, number>;
  total: number;
}

interface RawDecl {
  name: string;
  value: string;
  line: number;
  block: string;
  group: string;
  note: string | undefined;
  comment: string | undefined;
  deprecationNote: string | undefined;
}

interface DeprecationRun {
  /** null = every declaration in the run; otherwise names/globs it applies to. */
  scope: RegExp[] | null;
  text: string;
}

const DECL = /^\s*(--[A-Za-z0-9_-]+)\s*:\s*([^;]*);?/;
const TRAILING_COMMENT = /\/\*([\s\S]*?)\*\//;
const VAR_REF = /var\(\s*(--[A-Za-z0-9_-]+)/g;
const COLOR_LITERAL = /^(hsl|hsla|rgb|rgba|#|oklch|oklab|lab|lch|color-mix|color\()/i;

function cleanComment(text: string): string {
  return text
    .replace(/^\s*\/\*+/, "")
    .replace(/\*+\/\s*$/, "")
    .split("\n")
    .map((l) => l.replace(/^\s*\*?\s?/, "").trimEnd())
    .join("\n")
    .trim();
}

/** "── 2. Semantic + 3. Component — base…" → "Semantic + 3. Component". */
function headingLabel(text: string): string {
  const first = text.split("\n")[0] ?? "";
  return (
    first
      .replace(/[─━-]{2,}/g, " ")
      .replace(/^\s*\d+\.\s*/, "")
      .split(/\s—\s|\s\(/)[0]
      .replace(/[.:;,]\s*$/, "")
      .trim() || "Other"
  );
}

function baseName(name: string): string {
  return name.replace(/^--/, "").replace(/^color-/, "");
}

function globToRegExp(glob: string): RegExp {
  const esc = glob.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${esc}$`);
}

/** Reads a comment for a DEPRECATED marker and works out which names it covers. */
function deprecationRun(text: string, known: Set<string>): DeprecationRun | null {
  const m = text.match(/@?deprecated/i);
  if (!m || m.index === undefined) return null;
  // Only the part before "renamed to / use / → / instead" names the old tokens;
  // what follows names the replacement.
  const scopeText = text.slice(m.index + m[0].length).split(/renamed|\buse\b|→|instead/i)[0] ?? "";
  const words = scopeText.match(/[a-z0-9*][a-z0-9*-]*/gi) ?? [];
  const scope = words
    .filter((w) => (w.includes("*") ? w.length > 1 : known.has(w)))
    .map(globToRegExp);
  return { scope: scope.length ? scope : null, text };
}

function scaleCategory(name: string): string {
  const head = baseName(name).split("-")[0] ?? "";
  if (head === "shadow" || head === "elevation") return "elevation";
  if (head === "radius") return "radius";
  return head;
}

function tierOf(name: string, block: string, inPrimitives: boolean): TokenTier {
  if (inPrimitives || name.startsWith("--palette-")) return "primitive";
  if (block === "@theme") {
    if (name.startsWith("--color-") || name.startsWith("--shadow-")) return "bridge";
    return "scale";
  }
  if (/^--(chart|sidebar)(-|$)/.test(name)) return "component";
  if (/^--(elevation|radius|z|duration|ease|text|font)(-|$)/.test(name)) return "scale";
  return "semantic";
}

function resolve(value: string | undefined, map: Map<string, string>, depth = 0): string | undefined {
  if (value === undefined || depth > 12) return value;
  const whole = value.trim().match(/^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/);
  if (whole) return resolve(map.get(whole[1]), map, depth + 1) ?? value;
  return value.replace(/var\(\s*(--[A-Za-z0-9_-]+)\s*\)/g, (ref, n: string) => resolve(map.get(n), map, depth + 1) ?? ref);
}

/** Replacement utility for a deprecated color-mix tint: bg-{base}/{10|15}. */
function tintReplacement(value: string, map: Map<string, string>): string | undefined {
  const m = value.match(/color-mix\(\s*in\s+\w+\s*,\s*var\((--[A-Za-z0-9_-]+)\)\s+([^,]+),/);
  if (!m) return undefined;
  const pct = parseFloat(resolve(m[2].trim(), map) ?? "15");
  const step = Number.isFinite(pct) && pct <= 10 ? 10 : 15;
  return `${m[1]}/${step}`;
}

function colorUtility(base: string): string {
  if (/(^|-)(foreground|ink)$/.test(base)) return `text-${base}`;
  if (base === "border" || base === "input" || base.endsWith("-border")) return `border-${base}`;
  if (base === "ring" || base.endsWith("-ring")) return `ring-${base}`;
  return `bg-${base}`;
}

export function parseTokens(css: string): TokenData {
  const known = new Set<string>();
  for (const m of css.matchAll(/^\s*(--[A-Za-z0-9_-]+)\s*:/gm)) known.add(baseName(m[1]));

  const decls: RawDecl[] = [];
  const utilityRefs = new Map<string, string[]>(); // token → @utility names
  const lines = css.split("\n");

  let depth = 0;
  let block = "";
  let utilityName = "";
  let inPrimitivesBlock = false;
  let sawPrimitivesMarker = false;
  let pendingSelector = "";
  let group = "";
  let note: string | undefined;
  let run: DeprecationRun | null = null;
  let afterBlank = true;
  let commentBuf: string[] | null = null;

  const handleComment = (raw: string) => {
    const text = cleanComment(raw);
    if (depth === 0) {
      if (/1\.\s*Primitives/.test(text)) sawPrimitivesMarker = true;
      group = headingLabel(text);
      note = undefined;
      run = null;
      afterBlank = true;
      return;
    }
    if (afterBlank) {
      group = headingLabel(text);
      note = undefined;
    } else {
      note = text;
    }
    run = deprecationRun(text, known);
    afterBlank = false;
  };

  lines.forEach((rawLine, i) => {
    const lineNo = i + 1;
    let line = rawLine;

    // Multi-line comments.
    if (commentBuf) {
      commentBuf.push(line);
      if (line.includes("*/")) {
        handleComment(commentBuf.join("\n"));
        commentBuf = null;
      }
      return;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("/*")) {
      if (trimmed.includes("*/")) handleComment(trimmed);
      else commentBuf = [line];
      return;
    }
    if (trimmed === "") {
      afterBlank = true;
      note = undefined;
      run = null;
      return;
    }

    // Declarations (top level of a token block only).
    const decl = depth === 1 ? line.match(DECL) : null;
    if (decl && (block === "@theme" || block === ":root" || block === ".dark")) {
      const trailing = line.match(TRAILING_COMMENT);
      const comment = trailing ? cleanComment(trailing[0]) : undefined;
      const name = decl[1];
      let deprecationNote: string | undefined;
      const r = run as DeprecationRun | null;
      if (r && (r.scope === null || r.scope.some((re) => re.test(baseName(name))))) deprecationNote = r.text;
      if (comment && /deprecated|renamed/i.test(comment)) deprecationNote = comment;
      decls.push({
        name,
        value: decl[2].replace(TRAILING_COMMENT, "").trim(),
        line: lineNo,
        block: inPrimitivesBlock ? ":root (primitives)" : block,
        group,
        note,
        comment,
        deprecationNote,
      });
    } else if (depth >= 1 && utilityName) {
      for (const m of line.matchAll(VAR_REF)) {
        utilityRefs.set(m[1], [...(utilityRefs.get(m[1]) ?? []), utilityName]);
      }
    }

    // Brace tracking (strip inline comments first).
    let openedBlock = false;
    line = line.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const ch of line) {
      if (ch === "{") {
        if (depth === 0) {
          const sel = (pendingSelector + line.slice(0, line.indexOf("{"))).trim().split("\n").pop()?.trim() ?? "";
          utilityName = sel.startsWith("@utility") ? sel.replace("@utility", "").trim() : "";
          block = sel.startsWith("@theme") ? "@theme" : sel === ":root" ? ":root" : sel === ".dark" ? ".dark" : sel;
          inPrimitivesBlock = block === ":root" && sawPrimitivesMarker && !decls.some((d) => d.block === ":root (primitives)");
          openedBlock = true;
        }
        depth++;
        pendingSelector = "";
      } else if (ch === "}") {
        depth = Math.max(0, depth - 1);
        if (depth === 0) {
          block = "";
          utilityName = "";
          inPrimitivesBlock = false;
          run = null;
          note = undefined;
        }
      }
    }
    if (depth === 0 && !line.includes("{") && !line.includes("}")) pendingSelector += `${line}\n`;
    else if (depth === 0) pendingSelector = "";
    // A block's first comment counts as a heading, like one after a blank line.
    afterBlank = openedBlock;
  });

  // ── Merge declarations into tokens ────────────────────────────────────────
  const lightMap = new Map<string, string>();
  const darkOverrides = new Map<string, string>();
  for (const d of decls) {
    if (d.block === ".dark") darkOverrides.set(d.name, d.value);
    else if (!lightMap.has(d.name)) lightMap.set(d.name, d.value);
  }
  const darkMap = new Map([...lightMap, ...darkOverrides]);

  const byName = new Map<string, Token>();
  for (const d of decls) {
    const existing = byName.get(d.name);
    if (existing) {
      if (d.deprecationNote && !existing.deprecated) {
        existing.deprecated = true;
        existing.deprecationNote = d.deprecationNote;
      }
      continue;
    }
    const primitive = d.block === ":root (primitives)";
    const block = primitive ? ":root" : d.block;
    const tier = tierOf(d.name, block, primitive);
    const light = lightMap.get(d.name);
    const rl = resolve(light, lightMap);
    byName.set(d.name, {
      name: d.name,
      tier,
      category: tier === "scale" || tier === "bridge" ? scaleCategory(d.name) : "",
      group: d.group || "Other",
      block,
      line: d.line,
      light,
      dark: darkOverrides.get(d.name),
      resolvedLight: rl,
      resolvedDark: resolve(darkMap.get(d.name), darkMap),
      comment: d.comment,
      note: d.note,
      deprecated: Boolean(d.deprecationNote),
      deprecationNote: d.deprecationNote,
      replacement: undefined,
      utilities: [],
      isColor: Boolean(rl && COLOR_LITERAL.test(rl.trim())),
      usedBy: [],
    });
  }
  const tokens = [...byName.values()];

  // References (usedBy).
  for (const d of decls) {
    for (const m of d.value.matchAll(VAR_REF)) {
      const target = byName.get(m[1]);
      if (target && !target.usedBy.includes(d.name)) target.usedBy.push(d.name);
    }
  }

  // Bridge tokens inherit deprecation from the token they map, and vice versa.
  for (const t of tokens) {
    if (t.tier !== "bridge") continue;
    const target = t.light?.match(/^var\((--[A-Za-z0-9_-]+)\)$/)?.[1];
    const tt = target ? byName.get(target) : undefined;
    if (tt?.deprecated && !t.deprecated) {
      t.deprecated = true;
      t.deprecationNote = tt.deprecationNote;
    }
  }

  // Tailwind usage.
  const addUtil = (t: Token | undefined, u: string) => {
    if (t && !t.utilities.includes(u)) t.utilities.push(u);
  };
  for (const t of tokens) {
    const base = baseName(t.name);
    if (t.tier === "bridge") {
      const target = byName.get(t.light?.match(/^var\((--[A-Za-z0-9_-]+)\)$/)?.[1] ?? "");
      const util = t.name.startsWith("--shadow-") ? `shadow-${base.replace(/^shadow-/, "")}` : colorUtility(base);
      addUtil(t, util);
      addUtil(target, util);
    } else if (t.block === "@theme") {
      const [head, ...rest] = base.split("-");
      const suffix = rest.join("-");
      if (base.endsWith("--line-height")) continue;
      if (head === "text") addUtil(t, `text-${suffix}`);
      else if (head === "ease") addUtil(t, `ease-${suffix}`);
      else if (head === "font") addUtil(t, `font-${suffix}`);
      else if (head === "radius") addUtil(t, `rounded-${suffix}`);
      else addUtil(t, `${head}-[var(${t.name})]`);
    }
  }
  for (const [name, utils] of utilityRefs) for (const u of utils) addUtil(byName.get(name), u);
  for (const t of tokens) if (!t.utilities.length && t.tier !== "primitive") t.utilities.push(`var(${t.name})`);

  // Replacements for deprecated tokens.
  const replacementOf = (t: Token, seen = new Set<string>()): string | undefined => {
    if (seen.has(t.name)) return undefined;
    seen.add(t.name);
    const v = t.light ?? "";
    const alias = v.match(/^var\((--[A-Za-z0-9_-]+)\)$/)?.[1];
    if (alias) {
      const target = byName.get(alias);
      if (target && !target.deprecated) return alias;
      if (target) return replacementOf(target, seen);
    }
    const tint = tintReplacement(v, lightMap);
    if (tint) {
      const [baseTok, step] = tint.split("/");
      const target = byName.get(baseTok);
      const final = target?.deprecated ? replacementOf(target, seen) ?? baseTok : baseTok;
      return `bg-${baseName(final)}/${step}`;
    }
    const use = t.deprecationNote?.match(/\buse\s+([^.;]+)/i)?.[1];
    return use?.trim();
  };
  for (const t of tokens) if (t.deprecated) t.replacement = replacementOf(t);

  const counts: Record<TokenTier, number> = { primitive: 0, semantic: 0, component: 0, scale: 0, bridge: 0 };
  for (const t of tokens) counts[t.tier]++;
  return { tokens, byName, counts, total: tokens.length };
}

/** `var(--palette-green-700)` → `--palette-green-700`; other values unchanged. */
export function shortValue(value: string | undefined): string {
  if (value === undefined) return "";
  return value.replace(/var\((--[A-Za-z0-9_-]+)\)/g, "$1");
}

/** Tailwind colour utility for a token's replacement (`--severity-critical` → `bg-severity-critical`). */
export function replacementUtility(replacement: string | undefined): string | undefined {
  if (!replacement) return undefined;
  if (replacement.startsWith("--")) return colorUtility(baseName(replacement));
  return replacement;
}
