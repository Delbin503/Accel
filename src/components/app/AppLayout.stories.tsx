import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { PageHeader, PageHeaderContent, PageHeaderDescription, PageHeaderTitle } from "@accel/ui/components/layout";
import { KpiCard, KpiGrid } from "@accel/ui/components/shared/KpiCard";

/**
 * The full app shell: sidebar, top bar (search, quick actions, theme, system
 * status, downloads, notifications, user menu) and an `<Outlet />` for the page.
 *
 * Needs a router (MemoryRouter here). The top-bar widgets read global Zustand
 * stores (auth, notifications, downloads, command palette), which work without
 * a provider but start from their defaults — so the user menu, bell and
 * downloads show whatever those defaults are, not a signed-in session.
 */
const meta: Meta<typeof AppLayout> = {
  title: "App/AppLayout",
  component: AppLayout,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  // The app's ThemeProvider reads its saved theme first — seed it from the
  // Storybook toolbar so it doesn't flip <html> back to another theme.
  beforeEach: ({ globals }) => {
    localStorage.setItem("dashboard-theme", globals.theme ?? "dark");
  },
};

export default meta;
type Story = StoryObj<typeof AppLayout>;

function SamplePage() {
  return (
    <div className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Dashboard</PageHeaderTitle>
          <PageHeaderDescription>3 sites · 14 cameras · last 24 hours</PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>
      <KpiGrid cols={4}>
        <KpiCard label="Cameras online" value="11 / 14" sub="3 offline" tone="success" />
        <KpiCard label="Detections" value={142} sub="Last 24 hours" tone="primary" />
        <KpiCard label="Critical" value={3} sub="Unresolved" tone="severity-critical" />
        <KpiCard label="Sites" value={3} sub="All healthy" tone="info" />
      </KpiGrid>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <ThemeProvider>
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="*" element={<SamplePage />} />
        </Route>
      </Routes>
    </MemoryRouter>
    </ThemeProvider>
  ),
};
