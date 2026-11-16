import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PhoneField } from "./PhoneField";

const meta: Meta<typeof PhoneField> = {
  title: "Shared/PhoneField",
  component: PhoneField,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof PhoneField>;

function Controlled({ dial = "+65", initial = "" }: { dial?: string; initial?: string }) {
  const [dialCode, setDialCode] = React.useState(dial);
  const [number, setNumber] = React.useState(initial);
  return <PhoneField dialCode={dialCode} number={number} onDialCode={setDialCode} onNumber={setNumber} />;
}

/** Empty — the dial-code picker is searchable by country or code. */
export const Default: Story = {
  render: () => <Controlled />,
};

export const Filled: Story = {
  render: () => <Controlled initial="9123 4567" />,
};

export const OtherCountry: Story = {
  render: () => <Controlled dial="+60" initial="12 345 6789" />,
};
