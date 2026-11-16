import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListErrorState, ListLoadingState } from "./PageStates";
import { EmptyState } from "./EmptyState";
import { Cctv } from "lucide-react";

/**
 * Loading and error views for list pages (KPI grid + filter bar + table).
 * Pair with `EmptyState` for the empty case.
 */
const meta: Meta<typeof ListLoadingState> = {
  title: "Shared/PageStates",
  component: ListLoadingState,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof ListLoadingState>;

export const Loading: Story = {
  render: () => (
    <div className="space-y-4">
      <ListLoadingState />
    </div>
  ),
};

export const LoadingCompact: Story = {
  render: () => (
    <div className="space-y-4">
      <ListLoadingState kpiCols={3} columns={4} rows={3} />
    </div>
  ),
};

export const ErrorState: Story = {
  render: () => <ListErrorState onRetry={() => {}} />,
};

export const ErrorCustomCopy: Story = {
  render: () => (
    <ListErrorState
      title="Couldn't load cameras"
      message="The Changi Logistics Hub NVR didn't respond. Check its connection and try again."
      onRetry={() => {}}
    />
  ),
};

/** Without `onRetry` there is no Retry button. */
export const ErrorNoRetry: Story = {
  render: () => <ListErrorState title="Access denied" message="You don't have permission to view this site's cameras." />,
};

/** The empty case uses the shared EmptyState. */
export const Empty: Story = {
  render: () => <EmptyState icon={Cctv} title="No cameras yet" />,
};
