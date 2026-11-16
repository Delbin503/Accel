import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PasswordStrengthBar } from "./PasswordStrengthBar";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const meta: Meta<typeof PasswordStrengthBar> = {
  title: "Shared/PasswordStrengthBar",
  component: PasswordStrengthBar,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-72"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof PasswordStrengthBar>;

/** Live — type a password. Renders nothing while the field is empty. */
export const Default: Story = {
  render: function DefaultStory() {
    const [pw, setPw] = React.useState("");
    return (
      <div className="space-y-2">
        <Label htmlFor="pw">New password</Label>
        <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <PasswordStrengthBar password={pw} />
      </div>
    );
  },
};

/** Every score, 0 (too short) to 4 (strong). */
export const AllLevels: Story = {
  render: () => (
    <div className="space-y-4">
      {["accel", "accelcam", "Accelcam1", "Accelcam2026", "Accel-Cam#2026"].map((pw) => (
        <div key={pw} className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground">{pw}</p>
          <PasswordStrengthBar password={pw} />
        </div>
      ))}
    </div>
  ),
};

/** Empty password renders nothing. */
export const Empty: Story = {
  args: { password: "" },
};
