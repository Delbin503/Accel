import type { Meta, StoryObj } from "@storybook/react-vite";
import { Banner } from "./Banner";
import { Button } from "../ui/button";

const meta: Meta<typeof Banner> = {
  title: "Shared/Banner",
  component: Banner,
  tags: ["autodocs"],
  args: { onDismiss: () => {} },
};

export default meta;
type Story = StoryObj<typeof Banner>;

export const Info: Story = {
  args: {
    tone: "info",
    title: "Plan changed · Professional Cloud → Standard Cloud",
    children: "Your team now has 5 seats (3 in use), was 15. Total due today S$2,093 → S$509.",
  },
};

export const WarningWithAction: Story = {
  args: {
    tone: "warning",
    title: "Plan changed · Standard Cloud → Starter Cloud",
    children: "Starter Cloud includes 1 seat, but your team has 3. Remove 2 members or choose a bigger plan.",
    action: (
      <Button variant="outline" size="sm">
        Edit members
      </Button>
    ),
  },
};

export const SystemAlert: Story = {
  args: {
    tone: "warning",
    title: "Alert · Memory running slow",
    children: (
      <>
        Memory usage is at <strong className="text-foreground">68%</strong>. Contact your administrator immediately.
      </>
    ),
  },
};

export const Success: Story = {
  args: { tone: "success", title: "Payment received", children: "Your Professional Cloud plan is active." },
};

/** `size="sm"` without a title — the form-error look. */
export const FormError: Story = {
  args: {
    tone: "critical",
    size: "sm",
    onDismiss: undefined,
    children: "Enter a valid card number.",
  },
};
