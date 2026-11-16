import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertTriangle, Building2, Cctv, Film, LayoutDashboard, Plus, Settings, Video } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "./sidebar";

/**
 * The shadcn sidebar primitive. Every part reads `useSidebar()`, so stories are
 * wrapped in `SidebarProvider` (which also supplies a TooltipProvider).
 */
const meta: Meta<typeof Sidebar> = {
  title: "UI/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  argTypes: {
    variant: { control: "select", options: ["sidebar", "floating", "inset"] },
    collapsible: { control: "select", options: ["offcanvas", "icon", "none"] },
    side: { control: "select", options: ["left", "right"] },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Live Monitoring", icon: Video },
  { label: "Recordings", icon: Film },
  { label: "Detection Feed", icon: AlertTriangle, badge: "12" },
];

function Shell(args: React.ComponentProps<typeof Sidebar>) {
  return (
    <SidebarProvider>
      <Sidebar {...args}>
        <SidebarHeader>
          <SidebarInput placeholder="Search cameras…" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Monitor</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((n) => (
                  <SidebarMenuItem key={n.label}>
                    <SidebarMenuButton isActive={n.active} tooltip={n.label}>
                      <n.icon />
                      <span>{n.label}</span>
                    </SidebarMenuButton>
                    {n.badge && <SidebarMenuBadge>{n.badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupAction title="Add site">
              <Plus />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Sites">
                    <Building2 />
                    <span>Sites</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive>Changi Logistics Hub</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>Jurong Warehouse 2</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Cameras">
                    <Cctv />
                    <span>Cameras</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground">Dashboard</span>
        </header>
        <div className="p-6 text-base text-muted-foreground">Page content</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const Default: Story = {
  args: { variant: "sidebar", collapsible: "offcanvas", side: "left" },
  render: (args) => <Shell {...args} />,
};

/** Collapses to an icon rail; labels move into tooltips. */
export const IconCollapsible: Story = {
  args: { collapsible: "icon" },
  render: (args) => <Shell {...args} />,
};

export const Floating: Story = {
  args: { variant: "floating" },
  render: (args) => <Shell {...args} />,
};

export const Inset: Story = {
  args: { variant: "inset" },
  render: (args) => <Shell {...args} />,
};

export const RightSide: Story = {
  args: { side: "right" },
  render: (args) => <Shell {...args} />,
};

/** Menu button sizes and variants. */
export const MenuButtonVariants: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar collapsible="none" className="rounded-[var(--radius)] border border-border">
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {(["sm", "default", "lg"] as const).map((size) => (
                <SidebarMenuItem key={size}>
                  <SidebarMenuButton size={size}>
                    <Cctv />
                    <span>Size {size}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton variant="outline">
                  <Video />
                  <span>Outline variant</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Film />
                  <span>Disabled</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  ),
};

/** Placeholder rows while nav items load. */
export const Loading: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar collapsible="none" className="rounded-[var(--radius)] border border-border">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Sites</SidebarGroupLabel>
            <SidebarMenu>
              {[0, 1, 2, 3].map((i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  ),
};
