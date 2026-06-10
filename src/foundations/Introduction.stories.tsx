import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Introduction",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-md font-bold text-foreground">{title}</h3>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export const Overview: Story = {
  render: () => (
    <div className="mx-auto max-w-4xl space-y-8 p-10">
      <header className="space-y-2">
        <span className="text-2xs font-bold uppercase tracking-widest text-primary">
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
        <Card title="Foundations">
          Type scale, colors, spacing, radius, motion, z-index and icon conventions. Start here —
          everything else builds on these tokens.
        </Card>
        <Card title="UI">
          shadcn primitives we own in <code className="font-mono text-xs">components/ui/</code> —
          Button, Select, Table, Tabs, Dialog, and more. Reach for these first.
        </Card>
        <Card title="Shared">
          App-level composites in <code className="font-mono text-xs">components/shared/</code> —
          StatusBadge, EmptyState, SectionCard, FilterDropdown, DataTable, ConfirmDialog.
        </Card>
        <Card title="Charts">
          Recharts wrappers in <code className="font-mono text-xs">components/charts/</code> that
          apply the chart palette and consistent axis styling.
        </Card>
      </div>

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
