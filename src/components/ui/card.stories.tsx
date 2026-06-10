import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>North Distribution Center</CardTitle>
        <CardDescription>11 of 14 cameras online</CardDescription>
        <CardAction>
          <Button variant="ghost" size="xs">
            Manage
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Last detection 4 minutes ago · 2 open cases.
      </CardContent>
      <CardFooter>
        <Button size="sm" className="w-full">
          View site
        </Button>
      </CardFooter>
    </Card>
  ),
};
