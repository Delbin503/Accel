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
        "severity-critical",
        "severity-medium",
        "severity-low",
        "info",
        "secondary",
        "violet",
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
      <KpiCard label="Primary" value={142} sub="All time" tone="primary" />
      <KpiCard label="Success" value={98} sub="Resolved" tone="success" />
      <KpiCard label="Warning" value={17} sub="Pending" tone="warning" />
      <KpiCard label="Critical" value={3} sub="Unresolved" tone="severity-critical" />
      <KpiCard label="Info" value={24} sub="Informational" tone="info" />
    </KpiGrid>
  ),
};

export const Clickable: Story = {
  render: () => (
    <KpiGrid cols={4}>
      <KpiCard label="Total Cameras" value="11 / 14" sub="3 offline" tone="severity-critical" onClick={() => {}} />
      <KpiCard label="Online" value={8} sub="Streaming" tone="success" onClick={() => {}} active />
      <KpiCard label="Offline" value={3} sub="Check required" tone="warning" onClick={() => {}} />
      <KpiCard label="Alerts Today" value={21} sub="Last 24 hours" tone="info" onClick={() => {}} />
    </KpiGrid>
  ),
};

export const Compact: Story = {
  render: () => (
    <KpiGrid cols={4}>
      <KpiCard compact label="Cameras" value="11 / 14" tone="primary" />
      <KpiCard compact label="Online" value={8} tone="success" />
      <KpiCard compact label="Offline" value={3} tone="severity-critical" />
      <KpiCard compact label="Alerts" value={21} tone="warning" />
    </KpiGrid>
  ),
};

export const ActiveFilter: Story = {
  args: {
    label: "Critical Alerts",
    value: 3,
    sub: "Click to clear filter",
    accent: "severity-critical",
    active: true,
    onClick: () => {},
  },
};

export const WithTrend: Story = {
  render: () => (
    <KpiGrid cols={3}>
      <KpiCard label="Total Cases" value={250} sub="+60 added" tone="primary" trend={{ value: "12.5%", direction: "up" }} />
      <KpiCard label="Closed" value={60} sub="+40 closed" tone="success" trend={{ value: "2.5%", direction: "up" }} />
      <KpiCard
        label="Critical Events"
        value={14}
        sub="vs prior"
        tone="severity-critical"
        trend={{ value: "8.0%", direction: "up", sentiment: "negative" }}
      />
    </KpiGrid>
  ),
};
