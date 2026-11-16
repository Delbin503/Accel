import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Introduction",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// `level` keeps the heading outline valid: cards directly under the page <h1>
// are h2, cards inside an <h2> section are h3. Visual style is identical.
function Card({
  title,
  level = "h3",
  children,
}: {
  title: string;
  level?: "h2" | "h3";
  children: React.ReactNode;
}) {
  const Heading = level;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Heading className="text-md font-bold text-foreground">{title}</Heading>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export const Overview: Story = {
  render: () => (
    <div className="mx-auto max-w-4xl space-y-8 p-10">
      <header className="space-y-2">
        <span className="text-2xs font-bold uppercase tracking-widest text-primary-ink">
          Accel TRMS
        </span>
        <h1 className="text-3xl font-bold text-foreground">Design System</h1>
        <p className="text-md text-muted-foreground">
          The shared visual language and component library for the Accel dashboard. Everything is
          built on shadcn/ui primitives, design-token CSS variables, and a dense type scale tuned
          for data-heavy security operations.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card level="h2" title="Foundations">
          Type scale, colors, spacing, radius, motion, z-index and icon conventions. Start here —
          everything else builds on these tokens.
        </Card>
        <Card level="h2" title="UI">
          shadcn primitives we own in <code className="font-mono text-xs">components/ui/</code> —
          Button, Select, Table, Tabs, Dialog, and more. Reach for these first.
        </Card>
        <Card level="h2" title="Shared">
          App-level composites in <code className="font-mono text-xs">components/shared/</code> —
          StatusBadge, EmptyState, SectionCard, FilterDropdown, DataTable, ConfirmDialog.
        </Card>
        <Card level="h2" title="Charts">
          Recharts wrappers in <code className="font-mono text-xs">components/charts/</code> that
          apply the chart palette and consistent axis styling.
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Folders</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="Reusable — ui/ and shared/">
            <code className="font-mono text-xs">ui/</code> holds shadcn primitives;{" "}
            <code className="font-mono text-xs">shared/</code> holds composites built from them.
            Both are product-agnostic and never import stores, mocks, pages or the router.
          </Card>
          <Card title="Accel-only — app/">
            Components tied to Accel state, routing or flows (UserMenu, NotificationsBell,
            CommandPalette, onboarding). Not part of the reusable library.
          </Card>
          <Card title="layout/, charts/, custom/">
            <code className="font-mono text-xs">layout/</code> holds reusable page structure
            (PageHeader) — the Accel shell (AppLayout, AppSidebar) lives in app/; <code className="font-mono text-xs">charts/</code> wraps Recharts;{" "}
            <code className="font-mono text-xs">custom/</code> holds one-off patterns such as
            CoachMark and GuideGifModal.
          </Card>
          <Card title="Pages compose, they don't invent">
            Pages use existing components only. If nothing fits,{" "}
            <strong className="text-foreground">ask before creating a new one</strong> — propose its
            name, folder, props and variants first.
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Token tiers</h2>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">1 · Palette</strong> — raw primitives,{" "}
            <code className="font-mono text-xs">--palette-{"{hue}"}-{"{step}"}</code> (e.g.{" "}
            <code className="font-mono text-xs">--palette-neutral-930</code>). Only semantic tokens
            read these; components never do.
          </li>
          <li>
            <strong className="text-foreground">2 · Semantic</strong> — roles such as{" "}
            <code className="font-mono text-xs">background</code>,{" "}
            <code className="font-mono text-xs">muted-foreground</code>,{" "}
            <code className="font-mono text-xs">primary</code>,{" "}
            <code className="font-mono text-xs">severity-critical/high/medium/low</code>. These switch
            for dark mode and are what components use.
          </li>
          <li>
            <strong className="text-foreground">3 · Component</strong> — scoped tokens for one
            surface, e.g. <code className="font-mono text-xs">--sidebar-*</code> and the chart palette.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Naming & props</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Tokens</strong> —{" "}
            <code className="font-mono text-xs">--palette-*</code> for primitives,{" "}
            <code className="font-mono text-xs">severity-*</code> for severity (never the old{" "}
            <code className="font-mono text-xs">sev-*</code>), <code className="font-mono text-xs">violet</code>{" "}
            (never <code className="font-mono text-xs">purple</code>).
          </li>
          <li>
            <strong className="text-foreground">Layer names</strong> — every element carries{" "}
            <code className="font-mono text-xs">data-slot</code> as{" "}
            <code className="font-mono text-xs">{"{component}-{part}"}</code>, e.g.{" "}
            <code className="font-mono text-xs">date-range-bar-preset</code>.
          </li>
          <li>
            <strong className="text-foreground">variant</strong> = visual style (outline, ghost…),{" "}
            <strong className="text-foreground">tone</strong> = semantic colour (success, warning,
            severity-critical, violet…), <strong className="text-foreground">size</strong> = scale
            (sm, default, lg).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Core rules</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            ✓ Use <strong className="text-foreground">type-scale tokens</strong> (text-xs … text-4xl)
            — never <code className="font-mono text-xs">text-[11px]</code>.
          </li>
          <li>
            ✓ Use <strong className="text-foreground">semantic color tokens</strong>{" "}
            (text-foreground, bg-card, border-border) — never raw palette colors.
          </li>
          <li>
            ✓ Reach for a <strong className="text-foreground">ui/ primitive</strong> first, then a
            shared/ composite, before building anything new.
          </li>
          <li>
            ✓ Data-driven components handle{" "}
            <strong className="text-foreground">loading, empty and error</strong> states.
          </li>
          <li>✓ Lucide is the only icon library. Dark mode must work via tokens.</li>
        </ul>
      </section>
    </div>
  ),
};
