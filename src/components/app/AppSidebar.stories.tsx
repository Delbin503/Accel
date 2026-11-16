import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { AlertTriangle, Cctv, LayoutDashboard, Video } from "lucide-react";
import { AppSidebar, SidebarProvider, type NavGroup } from "./AppSidebar";
import { SidebarInset } from "@accel/ui/components/ui/sidebar";

/**
 * The app's navigation sidebar. Needs `SidebarProvider` (collapse state +
 * TooltipProvider) and a router (`NavLink` / `useLocation`) — stories use
 * `MemoryRouter` with `initialEntries` to set the active item.
 */
const meta: Meta<typeof AppSidebar> = {
  title: "App/AppSidebar",
  component: AppSidebar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof AppSidebar>;

function Frame({ path = "/", defaultOpen = true, groups }: { path?: string; defaultOpen?: boolean; groups?: NavGroup[] }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar groups={groups} />
        <SidebarInset>
          <div className="p-6 text-base text-muted-foreground">Current route: {path}</div>
        </SidebarInset>
      </SidebarProvider>
    </MemoryRouter>
  );
}

/** Expanded, Dashboard active. */
export const Default: Story = {
  render: () => <Frame />,
};

/** A nested route — its parent group opens and highlights. */
export const NestedActive: Story = {
  render: () => <Frame path="/detection-feed" />,
};

/** Collapsed to the icon rail; labels show as tooltips. */
export const Collapsed: Story = {
  render: () => <Frame defaultOpen={false} />,
};

/** A product built on the shell passes its own `groups`. */
export const CustomGroups: Story = {
  render: () => (
    <Frame
      path="/live"
      groups={[
        {
          label: "Operations",
          items: [
            { label: "Overview", href: "/", icon: LayoutDashboard },
            { label: "Live", href: "/live", icon: Video },
            { label: "Alerts", href: "/alerts", icon: AlertTriangle },
            { label: "Cameras", href: "/cameras", icon: Cctv },
          ],
        },
      ]}
    />
  ),
};
