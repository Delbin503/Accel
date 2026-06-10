import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "./StatusBadge";

const meta: Meta<typeof StatusBadge> = {
  title: "Shared/StatusBadge",
  component: StatusBadge,
  tags: ["autodocs"],
  argTypes: {
    tone: {
      control: "select",
      options: [
        "critical", "high", "medium", "low", "success",
        "warning", "info", "purple", "primary", "neutral",
      ],
    },
    dot: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Default: Story = {
  args: { tone: "success", children: "Online" },
};

export const Severities: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge tone="critical">Critical</StatusBadge>
      <StatusBadge tone="high">High</StatusBadge>
      <StatusBadge tone="medium">Medium</StatusBadge>
      <StatusBadge tone="low">Low</StatusBadge>
    </div>
  ),
};

export const CaseStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge tone="info">Open</StatusBadge>
      <StatusBadge tone="warning">In Review</StatusBadge>
      <StatusBadge tone="purple">Action Taken</StatusBadge>
      <StatusBadge tone="success">Closed</StatusBadge>
    </div>
  ),
};

export const DeviceHealth: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge tone="success">Online</StatusBadge>
      <StatusBadge tone="critical">Offline</StatusBadge>
      <StatusBadge tone="warning">Degraded</StatusBadge>
      <StatusBadge tone="neutral">Unknown</StatusBadge>
    </div>
  ),
};

export const WithoutDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge tone="primary" dot={false}>v2.4.1</StatusBadge>
      <StatusBadge tone="neutral" dot={false}>Draft</StatusBadge>
    </div>
  ),
};
