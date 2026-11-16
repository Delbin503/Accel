import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { OtpField } from "./OtpField";

const meta: Meta<typeof OtpField> = {
  title: "Shared/OtpField",
  component: OtpField,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof OtpField>;

function Controlled(props: Omit<React.ComponentProps<typeof OtpField>, "value" | "onChange"> & { initial?: string }) {
  const { initial = "", ...rest } = props;
  const [value, setValue] = React.useState(initial);
  return <OtpField value={value} onChange={setValue} {...rest} />;
}

/** Empty — type, Backspace or paste a six-digit code. */
export const Default: Story = {
  render: () => <Controlled aria-label="Verification code" />,
};

export const PartiallyFilled: Story = {
  render: () => <Controlled initial="482" />,
};

export const Complete: Story = {
  render: () => <Controlled initial="482913" />,
};

/** Wrong code returned by the server. */
export const Invalid: Story = {
  render: () => (
    <div className="space-y-2">
      <Controlled initial="482914" invalid />
      <p className="text-xs text-severity-critical">That code is incorrect or has expired.</p>
    </div>
  ),
};

/** Four-digit variant via `length`. */
export const FourDigits: Story = {
  render: () => <Controlled length={4} aria-label="Device pairing PIN" />,
};
