import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[28rem]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="cameras">Cameras</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-3 text-sm text-muted-foreground">
        Site summary, KPIs, and health at a glance.
      </TabsContent>
      <TabsContent value="cameras" className="pt-3 text-sm text-muted-foreground">
        11 of 14 cameras online.
      </TabsContent>
      <TabsContent value="activity" className="pt-3 text-sm text-muted-foreground">
        Recent detections and case updates.
      </TabsContent>
    </Tabs>
  ),
};
