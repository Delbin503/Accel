import type { Meta, StoryObj } from "@storybook/react-vite";
import { KpiCard, KpiGrid } from "./KpiCard";

const meta: Meta<typeof KpiCard> = {
  title: "Shared/KpiCard",
  component: KpiCard,
  tags: ["autodocs"],
  argTypes: {
    accent: {
      control: "select",
      options: [
        "primary",
        "success",
        "warning",
        "sev-critical",
        "sev-medium",
        "sev-low",
        "info",
        "secondary",
        "purple",
        "muted",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof KpiCard>;

export const Default: Story = {
  args: {
    label: "Total Alerts",
    value: 142,
    sub: "Across all sites",
    accent: "primary",
  },
};

export const Accents: Story = {
  render: () => (
    <KpiGrid cols={5}>
      <KpiCard label="Primary" value={142} sub="All time" accent="primary" />
      <KpiCard label="Success" value={98} sub="Resolved" accent="success" />
      <KpiCard label="Warning" value={17} sub="Pending" accent="warning" />
      <KpiCard label="Critical" value={3} sub="Unresolved" accent="sev-critical" />
      <KpiCard label="Info" value={24} sub="Informational" accent="info" />
    </KpiGrid>
  ),
};

export const Clickable: Story = {
  render: () => (
    <KpiGrid cols={4}>
      <KpiCard label="Total Cameras" value="11 / 14" sub="3 offline" accent="sev-critical" onClick={() => {}} />
      <KpiCard label="Online" value={8} sub="Streaming" accent="success" onClick={() => {}} active />
      <KpiCard label="Offline" value={3} sub="Check required" accent="warning" onClick={() => {}} />
      <KpiCard label="Alerts Today" value={21} sub="Last 24 hours" accent="info" onClick={() => {}} />
    </KpiGrid>
  ),
};

export const Compact: Story = {
  render: () => (
    <KpiGrid cols={4}>
      <KpiCard compact label="Cameras" value="11 / 14" accent="primary" />
      <KpiCard compact label="Online" value={8} accent="success" />
      <KpiCard compact label="Offline" value={3} accent="sev-critical" />
      <KpiCard compact label="Alerts" value={21} accent="warning" />
    </KpiGrid>
  ),
};

export const ActiveFilter: Story = {
  args: {
    label: "Critical Alerts",
    value: 3,
    sub: "Click to clear filter",
    accent: "sev-critical",
    active: true,
    onClick: () => {},
  },
};
