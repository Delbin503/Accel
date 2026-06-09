import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Spacing & Radius",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const RADII = [
  { token: "rounded-sm", cls: "rounded-sm" },
  { token: "rounded-md", cls: "rounded-md" },
  { token: "rounded-lg", cls: "rounded-lg" },
  { token: "rounded-xl", cls: "rounded-xl" },
  { token: "rounded-2xl", cls: "rounded-2xl" },
  { token: "rounded-full", cls: "rounded-full" },
];

const RHYTHM = [
  { rule: "Card padding", token: "p-4" },
  { rule: "Section gaps", token: "gap-3" },
  { rule: "Inline / icon gaps", token: "gap-1.5" },
  { rule: "Page section stack", token: "space-y-4" },
];

export const Radius: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-lg font-bold text-foreground">Border Radius</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All radii derive from the <code className="font-mono text-xs">--radius</code> token.
        </p>
      </div>
      <div className="flex flex-wrap gap-6">
        {RADII.map((r) => (
          <div key={r.token} className="flex flex-col items-center gap-2">
            <div className={`size-20 border border-border bg-card ${r.cls}`} />
            <code className="font-mono text-2xs text-muted-foreground">{r.token}</code>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const SpacingRhythm: Story = {
  render: () => (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-lg font-bold text-foreground">Spacing Rhythm</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Consistent spacing conventions across every module.
        </p>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {RHYTHM.map((r) => (
          <div key={r.token} className="flex items-center justify-between px-5 py-3.5">
            <span className="text-base text-foreground">{r.rule}</span>
            <code className="font-mono text-sm text-secondary">{r.token}</code>
          </div>
        ))}
      </div>
    </div>
  ),
};
