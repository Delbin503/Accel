import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bell, Camera, ShieldAlert, Video } from "lucide-react";

const meta: Meta = {
  title: "Foundations/Icons",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const SIZES = [
  { token: "size-3", px: "12px", use: "Inline badge / chip icons", cls: "size-3" },
  { token: "size-4", px: "16px", use: "Buttons, inputs, list rows", cls: "size-4" },
  { token: "size-5", px: "20px", use: "Section headers, empty states", cls: "size-5" },
  { token: "size-6", px: "24px", use: "Hero / feature only", cls: "size-6" },
];

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-lg font-bold text-foreground">Icon Sizes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lucide is the only icon library. Use these size conventions by context.
        </p>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {SIZES.map((s) => (
          <div key={s.token} className="flex items-center gap-6 px-5 py-4">
            <span className="flex w-10 justify-center">
              <Video className={`${s.cls} text-foreground`} />
            </span>
            <code className="w-20 shrink-0 font-mono text-sm text-secondary">{s.token}</code>
            <span className="w-16 shrink-0 text-sm text-muted-foreground">{s.px}</span>
            <span className="text-base text-foreground">{s.use}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-muted-foreground">
        <Camera className="size-4" />
        <Bell className="size-4" />
        <ShieldAlert className="size-4" />
        <Video className="size-4" />
        <span className="text-sm">— sample Lucide icons at size-4</span>
      </div>
    </div>
  ),
};
