import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Plus } from "lucide-react";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderTitle,
} from "./PageHeader";
import { Button } from "../ui/button";
import { StatusBadge } from "../shared/StatusBadge";

const meta: Meta<typeof PageHeader> = {
  title: "Layout/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderContent>
        <PageHeaderTitle>Cameras</PageHeaderTitle>
        <PageHeaderDescription>14 cameras across 3 sites · 3 offline</PageHeaderDescription>
      </PageHeaderContent>
      <PageHeaderActions>
        <Button variant="outline">
          <Download className="size-4" /> Export
        </Button>
        <Button>
          <Plus className="size-4" /> Add camera
        </Button>
      </PageHeaderActions>
    </PageHeader>
  ),
};

/** Title only. */
export const TitleOnly: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderContent>
        <PageHeaderTitle>Detection Feed</PageHeaderTitle>
      </PageHeaderContent>
    </PageHeader>
  ),
};

/** With a meta row (site, status, last updated). */
export const WithMeta: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderContent>
        <PageHeaderMeta>
          <span>Sites / Changi Logistics Hub</span>
          <StatusBadge tone="success">Healthy</StatusBadge>
          <span>Updated 2 min ago</span>
        </PageHeaderMeta>
        <PageHeaderTitle>Changi Logistics Hub</PageHeaderTitle>
        <PageHeaderDescription>6 cameras · 2 NVRs · 21 detections today</PageHeaderDescription>
      </PageHeaderContent>
      <PageHeaderActions>
        <Button variant="outline">Edit site</Button>
      </PageHeaderActions>
    </PageHeader>
  ),
};

/** Compound API — `PageHeader.Title` etc. are the same parts. */
export const DotNotation: Story = {
  render: () => (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>Recordings</PageHeader.Title>
        <PageHeader.Description>Footage retained for 30 days</PageHeader.Description>
      </PageHeader.Content>
      <PageHeader.Actions>
        <Button variant="outline" disabled>
          <Download className="size-4" /> Export (select a clip)
        </Button>
      </PageHeader.Actions>
    </PageHeader>
  ),
};
