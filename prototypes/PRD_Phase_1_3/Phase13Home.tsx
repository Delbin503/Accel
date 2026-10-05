import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ScanFace } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAGES } from "./pages";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ProtoBreadcrumb } from "../_shared/ProtoBreadcrumb";
import { REID_NAV, REID_PAGES, REID_TITLE, isReidPath, reidNavLabel } from "./reid/reidNav";

/* ── Index ───────────────────────────────────────────────────────────── */

export function Phase13Index() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Phase 1.3</PageHeader.Title>
          <PageHeader.Description>
            Proposed features for the next phase. Each one is its own page, in the module it would
            ship inside — open it to review it at full size.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {PAGES.map((p) => {
          const Icon = p.icon;
          return (
            <Link
              key={p.path}
              to={p.path}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-md font-bold text-foreground">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.subtitle}</p>
                </div>
                <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">
                  {p.refs}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">{p.summary}</p>

              <ul className="flex flex-col gap-1">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/70" />
                    {pt}
                  </li>
                ))}
              </ul>

              <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold text-primary">
                Open page
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Separate module — its own pages and sidebar, not a Phase 1.3 page. */}
      <div className="mt-2 flex flex-col gap-3">
        <div>
          <h2 className="text-md font-bold text-foreground">Separate module</h2>
          <p className="text-xs text-muted-foreground">Opens with its own navigation, apart from the proposals above.</p>
        </div>
        <Link
          to={REID_PAGES[0].path}
          className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:max-w-[calc(50%-0.375rem)]"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
              <ScanFace className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-md font-bold text-foreground">{REID_TITLE}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{REID_PAGES.map((p) => p.title).join(" · ")}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Person re-identification as its own module, with its own Live Monitoring, Model Management
            and Model Deployment. Move between them from the module's sidebar.
          </p>
          <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold text-primary">
            Open module
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}

/* ── Shell ───────────────────────────────────────────────────────────── */

/* Inside the Re-ID module the sidebar carries only that module's pages. */
export function ShellSidebar() {
  const { pathname } = useLocation();
  return <AppSidebar groups={isReidPath(pathname) ? REID_NAV : undefined} />;
}

/** Trails for proposal routes the sidebar has no entry for. */
const PROPOSAL_TRAILS: Record<string, string[]> = {
  "/": ["Phase 1.3"],
  "/dashboard": ["Monitor", "Dashboard"],
  "/enhancement": ["Monitor", "Recordings", "Video Enhancement"],
};

/**
 * In-page breadcrumb, placed above the page title like every other Accel page
 * ("Monitor › Live Monitoring") — the same component the other prototypes use.
 * The trail comes from the sidebar: inside the Re-ID module from the module's
 * nav, elsewhere from the app's, with the few off-nav routes listed above.
 */
export function Breadcrumb({ className }: { className?: string }) {
  const { pathname } = useLocation();

  let trail: string[] | undefined = PROPOSAL_TRAILS[pathname];
  if (isReidPath(pathname)) {
    trail = [REID_TITLE];
    for (const group of REID_NAV) {
      for (const item of group.items) {
        if (item.href === pathname) trail = [group.label, item.label];
        const child = item.children?.find((c) => c.href === pathname);
        if (child) trail = [group.label, item.label, child.label];
      }
    }
  }

  return <ProtoBreadcrumb trail={trail} className={className} />;
}

/** Sidebar entries the Re-ID module has no page for. */
export function ReidNotInModule() {
  const { pathname } = useLocation();
  const label = reidNavLabel(pathname);
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-24 text-center text-muted-foreground">
      <p className="text-sm font-medium text-foreground">
        {label ? `${label} is not part of this module` : "Not part of this module"}
      </p>
      <p className="text-xs">
        The {REID_TITLE} covers <strong className="text-foreground">{REID_PAGES.map((p) => p.title).join(", ")}</strong>.
      </p>
      <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
        <Link to={REID_PAGES[0].path} className="text-primary hover:underline">Go to {REID_PAGES[0].title}</Link>
        <span className="text-muted-foreground/40">·</span>
        <Link to="/" className="text-muted-foreground hover:text-foreground hover:underline">Back to Phase 1.3</Link>
      </div>
    </div>
  );
}
