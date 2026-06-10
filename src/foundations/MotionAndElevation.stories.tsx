import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Motion & Z-index",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const DURATIONS = [
  { token: "--duration-fast", value: "120ms", use: "Hover, focus, small toggles" },
  { token: "--duration-normal", value: "200ms", use: "Dropdowns, popovers, tabs" },
  { token: "--duration-slow", value: "320ms", use: "Drawers, sheets, dialogs" },
];

const EASING = [
  { token: "ease-standard", use: "Most transitions" },
  { token: "ease-emphasized", use: "Entrances / attention" },
];

const ZINDEX = [
  { token: "--z-dropdown", value: "10" },
  { token: "--z-sticky", value: "20" },
  { token: "--z-overlay", value: "30" },
  { token: "--z-drawer", value: "40" },
  { token: "--z-modal", value: "50" },
  { token: "--z-toast", value: "60" },
  { token: "--z-tooltip", value: "70" },
];

export const Motion: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-lg font-bold text-foreground">Motion</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the duration tokens via{" "}
          <code className="font-mono text-xs">duration-[var(--duration-normal)]</code> and the
          easing utilities <code className="font-mono text-xs">ease-standard</code> /{" "}
          <code className="font-mono text-xs">ease-emphasized</code>.
        </p>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {DURATIONS.map((d) => (
          <div key={d.token} className="flex items-center gap-6 px-5 py-3.5">
            <code className="w-44 shrink-0 font-mono text-sm text-secondary">{d.token}</code>
            <span className="w-16 shrink-0 text-sm text-muted-foreground">{d.value}</span>
            <span className="text-base text-foreground">{d.use}</span>
          </div>
        ))}
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {EASING.map((e) => (
          <div key={e.token} className="flex items-center gap-6 px-5 py-3.5">
            <code className="w-44 shrink-0 font-mono text-sm text-secondary">{e.token}</code>
            <span className="text-base text-foreground">{e.use}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const ZIndex: Story = {
  render: () => (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-lg font-bold text-foreground">Z-index Scale</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Apply via <code className="font-mono text-xs">z-[var(--z-modal)]</code>. Never invent
          arbitrary values like <code className="font-mono text-xs">z-[100]</code>.
        </p>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {ZINDEX.map((z) => (
          <div key={z.token} className="flex items-center justify-between px-5 py-3">
            <code className="font-mono text-sm text-secondary">{z.token}</code>
            <span className="font-mono text-sm text-muted-foreground">{z.value}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};
