import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { PAGES } from "./pages";

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
    </div>
  );
}

/* ── Shell ───────────────────────────────────────────────────────────── */

export function Breadcrumb() {
  const { pathname } = useLocation();
  const page = PAGES.find((p) => p.path === pathname);
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-xs">
      <Link
        to="/"
        className={cn(
          "shrink-0 rounded px-1 py-0.5 transition-colors hover:text-foreground",
          page ? "text-muted-foreground" : "font-semibold text-foreground"
        )}
      >
        Phase 1.3
      </Link>
      {page && (
        <>
          <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
          <span className="truncate font-semibold text-foreground">{page.title}</span>
        </>
      )}
    </nav>
  );
}
