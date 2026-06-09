import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Colors",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

function Swatch({ token, bg, ring }: { token: string; bg: string; ring?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-16 w-full rounded-lg ${bg} ${ring ? "border border-border" : ""}`} />
      <code className="font-mono text-2xs text-muted-foreground">{token}</code>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-md font-bold text-foreground">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{children}</div>
    </section>
  );
}

export const Palette: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-lg font-bold text-foreground">Color Tokens</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Always use semantic tokens — never raw palette colors like{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">bg-gray-900</code>. Tokens
          switch automatically in dark mode.
        </p>
      </div>

      <Group title="Surfaces">
        <Swatch token="bg-background" bg="bg-background" ring />
        <Swatch token="bg-card" bg="bg-card" ring />
        <Swatch token="bg-popover" bg="bg-popover" ring />
        <Swatch token="bg-muted" bg="bg-muted" ring />
        <Swatch token="bg-accent" bg="bg-accent" ring />
        <Swatch token="border-border" bg="bg-border" ring />
      </Group>

      <Group title="Brand & Interactive">
        <Swatch token="bg-primary" bg="bg-primary" />
        <Swatch token="bg-primary-hover" bg="bg-primary-hover" />
        <Swatch token="bg-secondary" bg="bg-secondary" ring />
        <Swatch token="bg-destructive" bg="bg-destructive" />
        <Swatch token="ring" bg="bg-ring" />
      </Group>

      <Group title="Status & Severity">
        <Swatch token="bg-sev-critical" bg="bg-sev-critical" />
        <Swatch token="bg-sev-high" bg="bg-sev-high" />
        <Swatch token="bg-sev-medium" bg="bg-sev-medium" />
        <Swatch token="bg-sev-low" bg="bg-sev-low" />
        <Swatch token="bg-success" bg="bg-success" />
        <Swatch token="bg-warning" bg="bg-warning" />
        <Swatch token="bg-info" bg="bg-info" />
        <Swatch token="bg-purple" bg="bg-purple" />
      </Group>

      <Group title="Chart Palette">
        <Swatch token="--chart-1" bg="bg-chart-1" />
        <Swatch token="--chart-2" bg="bg-chart-2" />
        <Swatch token="--chart-3" bg="bg-chart-3" />
        <Swatch token="--chart-4" bg="bg-chart-4" />
        <Swatch token="--chart-5" bg="bg-chart-5" />
      </Group>

      <Group title="Text">
        <div className="col-span-full flex flex-col gap-2">
          <p className="text-foreground">text-foreground — primary body text</p>
          <p className="text-muted-foreground">text-muted-foreground — secondary / meta</p>
          <p className="text-primary">text-primary — brand accent text</p>
          <p className="text-destructive">text-destructive — errors</p>
        </div>
      </Group>
    </div>
  ),
};
