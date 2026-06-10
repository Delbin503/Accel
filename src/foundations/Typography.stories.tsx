import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Typography",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const SCALE = [
  { token: "text-3xs", px: "9px", use: "Micro labels, dense chips" },
  { token: "text-2xs", px: "10px", use: "Uppercase eyebrow labels, table meta" },
  { token: "text-xs", px: "11px", use: "Table data, captions, secondary meta" },
  { token: "text-sm", px: "12px", use: "Compact body, list rows" },
  { token: "text-base", px: "13px", use: "Body default" },
  { token: "text-md", px: "14px", use: "Emphasised body, field labels" },
  { token: "text-lg", px: "16px", use: "Section headers" },
  { token: "text-xl", px: "18px", use: "Card values, sub-headings" },
  { token: "text-2xl", px: "22px", use: "KPI values" },
  { token: "text-3xl", px: "24px", use: "Page titles" },
  { token: "text-4xl", px: "28px", use: "Hero numbers" },
];

const WEIGHTS = [
  { token: "font-normal", label: "Normal — 400" },
  { token: "font-medium", label: "Medium — 500" },
  { token: "font-semibold", label: "Semibold — 600" },
  { token: "font-bold", label: "Bold — 700" },
];

export const TypeScale: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-lg font-bold text-foreground">Type Scale</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dense dashboard scale. Always use the token — never{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">text-[11px]</code>.
        </p>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {SCALE.map((s) => (
          <div key={s.token} className="flex items-baseline gap-6 px-5 py-4">
            <code className="w-24 shrink-0 font-mono text-xs text-secondary">{s.token}</code>
            <span className="w-12 shrink-0 text-xs text-muted-foreground">{s.px}</span>
            <span className={`${s.token} flex-1 truncate font-semibold text-foreground`}>
              The quick brown fox
            </span>
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{s.use}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const FontWeights: Story = {
  render: () => (
    <div className="space-y-4 p-8">
      <h2 className="text-lg font-bold text-foreground">Font Weights</h2>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {WEIGHTS.map((w) => (
          <div key={w.token} className="flex items-baseline gap-6 px-5 py-4">
            <code className="w-32 shrink-0 font-mono text-xs text-secondary">{w.token}</code>
            <span className={`${w.token} text-lg text-foreground`}>{w.label}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Families: Story = {
  render: () => (
    <div className="space-y-4 p-8">
      <h2 className="text-lg font-bold text-foreground">Font Families</h2>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        <div className="flex items-baseline gap-6 px-5 py-4">
          <code className="w-28 shrink-0 font-mono text-xs text-secondary">font-sans</code>
          <span className="font-sans text-lg text-foreground">Manrope — UI & body text</span>
        </div>
        <div className="flex items-baseline gap-6 px-5 py-4">
          <code className="w-28 shrink-0 font-mono text-xs text-secondary">font-mono</code>
          <span className="font-mono text-lg text-foreground">JetBrains Mono — IDs, codes, metrics</span>
        </div>
      </div>
    </div>
  ),
};
