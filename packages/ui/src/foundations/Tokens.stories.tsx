import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, ArrowUpRight, FileCode, TriangleAlert } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { StatusBadge } from "../components/shared/StatusBadge";
import {
  replacementUtility,
  shortValue,
  tokenData,
  type Token,
  type TokenTier,
} from "./tokenData";

/**
 * Token Reference — every page here is generated from src/index.css at build
 * time (see tokenData.ts), so it cannot drift from the code. Add or rename a
 * token in index.css and it shows up here on the next reload.
 *
 * Swatches use inline `style={{ background: var(--token) }}`: the token name is
 * only known at runtime, so a Tailwind class can't be generated for it. The
 * var() still follows the toolbar theme.
 */
const meta: Meta = {
  title: "Foundations/Token Reference",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const { tokens, byName, counts, total } = tokenData;

const TIER_LABEL: Record<TokenTier, string> = {
  primitive: "Primitives",
  semantic: "Semantic",
  component: "Component",
  scale: "Scales",
  bridge: "Tailwind bridge",
};

function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) map.set(key(item), [...(map.get(key(item)) ?? []), item]);
  return [...map];
}

// ── Shared pieces ───────────────────────────────────────────────────────────

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs text-foreground">{children}</code>;
}

function StoryLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <a
      href={`/?path=/story/${id}`}
      target="_top"
      className="inline-flex items-center gap-1 text-sm font-medium text-primary-ink underline underline-offset-4"
    >
      {children}
      <ArrowUpRight className="size-3" aria-hidden />
    </a>
  );
}

function Page({ title, description, children }: { title: string; description: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-8">
      <header className="space-y-3">
        <span className="text-2xs font-bold uppercase tracking-widest text-primary-ink">Token Reference</span>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <div className="max-w-3xl text-md text-muted-foreground">{description}</div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            <FileCode aria-hidden />
            Generated from src/index.css · {total} tokens
          </Badge>
          {(Object.keys(TIER_LABEL) as TokenTier[]).map((tier) => (
            <Badge key={tier} variant="secondary">
              {TIER_LABEL[tier]} {counts[tier]}
            </Badge>
          ))}
        </div>
      </header>
      {children}
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {aside}
      </div>
      <div className="rounded-lg border border-border bg-card">{children}</div>
    </section>
  );
}

function Swatch({ token, className = "size-8" }: { token: string; className?: string }) {
  return (
    <div
      className={`${className} shrink-0 rounded-md border border-border`}
      style={{ background: `var(${token})` }}
      title={token}
    />
  );
}

function ThemeValue({ value, resolved }: { value: string | undefined; resolved: string | undefined }) {
  if (value === undefined) return <span className="text-xs text-muted-foreground">same as light</span>;
  return (
    <span className="flex flex-col gap-0.5">
      <code className="font-mono text-xs text-foreground">{shortValue(value)}</code>
      {resolved && resolved !== value && (
        <code className="font-mono text-2xs text-muted-foreground">{resolved}</code>
      )}
    </span>
  );
}

function DeprecatedMark({ token }: { token: Token }) {
  if (!token.deprecated) return null;
  return (
    <span className="flex flex-col items-start gap-1">
      <StatusBadge tone="warning">Deprecated</StatusBadge>
      {token.replacement && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowRight className="size-3" aria-hidden />
          <Code>{replacementUtility(token.replacement)}</Code>
        </span>
      )}
    </span>
  );
}

function TokenName({ token }: { token: Token }) {
  return (
    <span className="flex flex-col gap-0.5">
      <code className="font-mono text-xs font-semibold text-foreground">{token.name}</code>
      {token.comment && !token.deprecated && <span className="text-2xs text-muted-foreground">{token.comment}</span>}
    </span>
  );
}

// ── Semantic colors ─────────────────────────────────────────────────────────

const colorTokens = tokens.filter((t) => (t.tier === "semantic" || t.tier === "component") && t.isColor);
const otherSemantic = tokens.filter((t) => (t.tier === "semantic" || t.tier === "component") && !t.isColor);

function ColorTable({ items }: { items: Token[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <span className="sr-only">Swatch</span>
          </TableHead>
          <TableHead>Token</TableHead>
          <TableHead>Tailwind</TableHead>
          <TableHead>Light</TableHead>
          <TableHead>Dark</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((t) => (
          <TableRow key={t.name}>
            <TableCell className="whitespace-normal">
              <Swatch token={t.name} />
            </TableCell>
            <TableCell className="whitespace-normal">
              <TokenName token={t} />
            </TableCell>
            <TableCell className="whitespace-normal">
              <span className="flex flex-wrap gap-1">
                {t.utilities.map((u) => (
                  <Code key={u}>{u}</Code>
                ))}
              </span>
            </TableCell>
            <TableCell className="whitespace-normal">
              <ThemeValue value={t.light} resolved={t.resolvedLight} />
            </TableCell>
            <TableCell className="whitespace-normal">
              {t.dark === undefined && t.resolvedDark !== t.resolvedLight ? (
                <span className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">inherits</span>
                  <code className="font-mono text-2xs text-muted-foreground">{t.resolvedDark}</code>
                </span>
              ) : (
                <ThemeValue value={t.dark} resolved={t.resolvedDark} />
              )}
            </TableCell>
            <TableCell className="whitespace-normal">
              <DeprecatedMark token={t} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const SemanticColors: Story = {
  name: "Semantic colors",
  render: () => (
    <Page
      title="Semantic colors"
      description={
        <p>
          Every semantic and component colour token, grouped by its section in <Code>src/index.css</Code>. Swatches render{" "}
          <Code>var(--token)</Code>, so they follow the toolbar theme. The Tailwind column shows the main utility —
          every colour utility works (<Code>bg-</Code>, <Code>text-</Code>, <Code>border-</Code>, <Code>ring-</Code>,{" "}
          <Code>fill-</Code>…), with opacity modifiers for tints (<Code>/10</Code>, <Code>/15</Code>).
        </p>
      }
    >
      {groupBy(colorTokens, (t) => t.group).map(([group, items]) => (
        <Section key={group} title={group} aside={<span className="text-xs text-muted-foreground">{items.length} tokens</span>}>
          <ColorTable items={items} />
        </Section>
      ))}
      {otherSemantic.length > 0 && (
        <Section title="Non-colour semantic values">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Light</TableHead>
                <TableHead>Dark</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {otherSemantic.map((t) => (
                <TableRow key={t.name}>
                  <TableCell className="whitespace-normal">
                    <TokenName token={t} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <ThemeValue value={t.light} resolved={t.resolvedLight} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <ThemeValue value={t.dark} resolved={t.resolvedDark} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <DeprecatedMark token={t} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}
    </Page>
  ),
};

// ── Primitives ──────────────────────────────────────────────────────────────

const primitives = tokens.filter((t) => t.tier === "primitive");

export const Primitives: Story = {
  render: () => (
    <Page
      title="Primitives"
      description={
        <p>
          The raw <Code>--palette-{"{hue}"}-{"{step}"}</Code> ramps — the only place a literal colour appears. They are
          theme-independent; <Code>.dark</Code> re-points semantic tokens at different steps instead.
        </p>
      }
    >
      <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <p className="text-sm text-foreground">
          <strong>Never use primitives in components.</strong> They have no Tailwind utilities, and ESLint rejects{" "}
          <Code>var(--palette-*)</Code> in app code. Reference a semantic token instead (<Code>bg-card</Code>,{" "}
          <Code>text-severity-critical</Code>, <Code>var(--primary)</Code>).
        </p>
      </div>
      {groupBy(primitives, (t) => t.name.match(/^--palette-([a-z]+)-/)?.[1] ?? "other").map(([hue, items]) => (
        <Section key={hue} title={hue} aside={<span className="text-xs text-muted-foreground">{items.length} steps</span>}>
          <div className="flex flex-wrap gap-4 p-4">
            {items.map((t) => (
              <div key={t.name} className="flex w-28 flex-col gap-1.5">
                <Swatch token={t.name} className="h-12 w-full" />
                <code className="font-mono text-xs font-semibold text-foreground">
                  {t.name.replace(/^--palette-[a-z]+-/, "")}
                </code>
                <code className="font-mono text-2xs text-muted-foreground">{t.light}</code>
                <span className="text-2xs text-muted-foreground">
                  {t.usedBy.length ? `used by ${t.usedBy.length}` : "unused"}
                </span>
                {t.comment && <span className="text-2xs text-muted-foreground">{t.comment}</span>}
              </div>
            ))}
          </div>
        </Section>
      ))}
    </Page>
  ),
};

// ── Scales ──────────────────────────────────────────────────────────────────

const scale = (category: string) => tokens.filter((t) => t.tier === "scale" && t.category === category);

/** calc(var(--radius) * 0.6) → "4.8px", using the parsed --radius base. */
function radiusPx(t: Token): string {
  const base = parseFloat(byName.get("--radius")?.light ?? "");
  const rem = (v: string | undefined) => (v?.endsWith("rem") ? parseFloat(v) * 16 : NaN);
  const factor = t.light?.match(/\*\s*([\d.]+)/)?.[1];
  const px = t.name === "--radius" ? rem(t.light) : factor ? base * 16 * parseFloat(factor) : t.light === "var(--radius)" ? base * 16 : NaN;
  return Number.isFinite(px) ? `${+px.toFixed(2)}px` : "";
}

function ScaleTable({ items, columns }: { items: Token[]; columns: { label: string; cell: (t: Token) => React.ReactNode }[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usage</TableHead>
          <TableHead>Token</TableHead>
          {columns.map((c) => (
            <TableHead key={c.label}>{c.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((t) => (
          <TableRow key={t.name}>
            <TableCell className="whitespace-normal">
              <span className="flex flex-wrap gap-1">
                {t.utilities.map((u) => (
                  <Code key={u}>{u}</Code>
                ))}
              </span>
            </TableCell>
            <TableCell className="whitespace-normal">
              <code className="font-mono text-xs font-semibold text-foreground">{t.name}</code>
            </TableCell>
            {columns.map((c) => (
              <TableCell key={c.label} className="whitespace-normal">{c.cell(t)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const valueCol = { label: "Value", cell: (t: Token) => <code className="font-mono text-xs text-foreground">{shortValue(t.light)}</code> };
const noteCol = { label: "Note", cell: (t: Token) => <span className="text-xs text-muted-foreground">{t.comment}</span> };

export const Scales: Story = {
  render: () => (
    <Page
      title="Scales"
      description={
        <p>
          Type, z-index, motion, elevation and radius scales as declared in <Code>src/index.css</Code>. For visual demos
          see the hand-written foundation pages linked from each section.
        </p>
      }
    >
      <Section title="Type scale" aside={<StoryLink id="foundations-typography--type-scale">Typography</StoryLink>}>
        <ScaleTable
          items={scale("text").filter((t) => !t.name.endsWith("--line-height"))}
          columns={[
            valueCol,
            {
              label: "Line height",
              cell: (t) => <code className="font-mono text-xs text-foreground">{byName.get(`${t.name}--line-height`)?.light}</code>,
            },
            noteCol,
          ]}
        />
      </Section>
      <Section title="Font families" aside={<StoryLink id="foundations-typography--families">Families</StoryLink>}>
        <ScaleTable items={scale("font")} columns={[valueCol]} />
      </Section>
      <Section title="Z-index" aside={<StoryLink id="foundations-motion-elevation-z-index--z-index">Z-index</StoryLink>}>
        <ScaleTable items={scale("z")} columns={[valueCol, noteCol]} />
      </Section>
      <Section title="Durations" aside={<StoryLink id="foundations-motion-elevation-z-index--motion">Motion</StoryLink>}>
        <ScaleTable items={scale("duration")} columns={[valueCol, noteCol]} />
      </Section>
      <Section title="Easing" aside={<StoryLink id="foundations-motion-elevation-z-index--motion">Motion</StoryLink>}>
        <ScaleTable items={scale("ease")} columns={[valueCol, noteCol]} />
      </Section>
      <Section title="Elevation" aside={<StoryLink id="foundations-motion-elevation-z-index--elevation">Elevation</StoryLink>}>
        <ScaleTable
          items={scale("elevation")}
          columns={[
            { label: "Light", cell: (t) => <code className="font-mono text-2xs text-foreground">{t.light}</code> },
            {
              label: "Dark",
              cell: (t) => <code className="font-mono text-2xs text-foreground">{t.dark ?? "same as light"}</code>,
            },
          ]}
        />
      </Section>
      <Section title="Radius" aside={<StoryLink id="foundations-spacing-radius--radius">Radius</StoryLink>}>
        <ScaleTable
          items={scale("radius")}
          columns={[valueCol, { label: "Computed", cell: (t) => <span className="text-xs text-foreground">{radiusPx(t)}</span> }, noteCol]}
        />
      </Section>
    </Page>
  ),
};

// ── Deprecated ──────────────────────────────────────────────────────────────

const deprecated = tokens.filter((t) => t.deprecated && t.tier !== "bridge");
const deprecatedBridge = tokens.filter((t) => t.deprecated && t.tier === "bridge");

/** The part of a comment from its DEPRECATED / renamed marker onward, on one line. */
function deprecationSentence(note: string | undefined): string {
  const flat = (note ?? "").replace(/\s+/g, " ").trim();
  const at = flat.search(/deprecated|renamed/i);
  return at > 0 ? flat.slice(at) : flat;
}

export const Deprecated: Story = {
  render: () => (
    <Page
      title="Deprecated"
      description={
        <p>
          Tokens marked <Code>DEPRECATED</Code> in <Code>src/index.css</Code>. They are kept only for{" "}
          <Code>prototypes/</Code> and in-flight work, and ESLint rejects the old names in app code. The{" "}
          {deprecatedBridge.length} matching <Code>@theme</Code> mappings (<Code>--color-sev-*</Code>…) go away with them.
        </p>
      }
    >
      <Section title={`${deprecated.length} deprecated tokens`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <span className="sr-only">Swatch</span>
              </TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Old utility</TableHead>
              <TableHead>Replace with</TableHead>
              <TableHead>Source note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deprecated.map((t) => (
              <TableRow key={t.name}>
                <TableCell className="whitespace-normal">{t.isColor && <Swatch token={t.name} />}</TableCell>
                <TableCell className="whitespace-normal">
                  <code className="font-mono text-xs font-semibold text-foreground">{t.name}</code>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <span className="flex flex-wrap gap-1">
                    {t.utilities.map((u) => (
                      <Code key={u}>{u}</Code>
                    ))}
                  </span>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {t.replacement ? (
                    <span className="flex flex-col items-start gap-1">
                      <Code>{replacementUtility(t.replacement)}</Code>
                      {t.replacement.startsWith("--") && (
                        <code className="font-mono text-2xs text-muted-foreground">{t.replacement}</code>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Opacity modifier on the base token</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs whitespace-normal">
                  <span className="text-xs text-muted-foreground">{deprecationSentence(t.deprecationNote)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    </Page>
  ),
};
