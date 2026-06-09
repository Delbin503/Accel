import * as React from "react";
import { FolderOpen, Check, MapPin, User, ArrowUpRight, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useIncidentCasesStore } from "@/stores/useIncidentCasesStore";
import { SeverityBadge } from "@/pages/detection-feed/shared";
import { CaseStatusBadge } from "@/pages/incident-cases/index";
import type { IncidentCase } from "@/types/incidents";

interface LinkCaseModalProps {
  /** IDs of events being linked */
  eventIds: string[];
  /** Site key of the source event(s) — only cases from this site are shown */
  eventSite: string;
  /** Human-readable site name for display */
  eventSiteDisplay: string;
  open: boolean;
  onClose: () => void;
  /** Called with the selected caseId when user confirms */
  onConfirm: (caseId: string) => void;
}

function CaseOption({
  c,
  selected,
  onClick,
}: {
  c: IncidentCase;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
        selected
          ? "border-primary bg-primary-muted"
          : "border-border bg-muted/20 hover:border-primary"
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: `var(--sev-${c.severity})` }}
    >
      {/* Radio circle */}
      <span
        className={cn(
          "mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary" : "border-muted-foreground/40"
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-primary" />}
      </span>

      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {c.id}
          </span>
          <SeverityBadge severity={c.severity} />
          <CaseStatusBadge status={c.status} />
        </div>

        {/* Title */}
        <div className="text-base font-semibold leading-snug text-foreground">{c.title}</div>

        {/* Meta */}
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-2.5" />
            {c.siteDisplay}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="size-2.5" />
            {c.assignedTo.name}
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-px">
            {c.incidentIds.length} incident{c.incidentIds.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {selected && <Check className="mt-0.5 size-4 flex-shrink-0 text-primary" />}
    </button>
  );
}

export function LinkCaseModal({
  eventIds,
  eventSite,
  eventSiteDisplay,
  open,
  onClose,
  onConfirm,
}: LinkCaseModalProps) {
  const cases = useIncidentCasesStore((s) => s.cases);
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setSelectedCaseId(null);
      setQuery("");
    }
  }, [open]);

  /* Only show Open and In-Review cases from the same site */
  const eligible = cases.filter(
    (c) =>
      c.site === eventSite &&
      (c.status === "open" || c.status === "in-review")
  );

  /* Apply the in-modal search across id / title / owner */
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligible;
    return eligible.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.assignedTo.name.toLowerCase().includes(q)
    );
  }, [eligible, query]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Link to Incident Case</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {eventIds.length > 1
              ? `Linking ${eventIds.length} selected events`
              : "Linking 1 event"}{" "}
            · Showing Open &amp; In Review cases for{" "}
            <strong className="text-foreground">{eventSiteDisplay}</strong>
          </p>
        </DialogHeader>

        {/* Search — only when there are cases to search */}
        {eligible.length > 0 && (
          <div className="flex-shrink-0 px-5 pt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by case ID, title, or owner…"
                className="h-9 pl-9 text-base"
              />
            </div>
          </div>
        )}

        {/* Case list — scrolls internally once it exceeds ~4 cards */}
        <div className="px-5 py-4">
          {eligible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-muted-foreground">
              <FolderOpen className="size-10 opacity-20" />
              <p className="text-base">No open cases for {eventSiteDisplay}.</p>
              <p className="text-sm text-muted-foreground/70">
                Use &ldquo;Escalate Case&rdquo; to create a new case instead.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-muted-foreground">
              <Search className="size-7 opacity-20" />
              <p className="text-base">No cases match &ldquo;{query}&rdquo;.</p>
            </div>
          ) : (
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {filtered.map((c) => (
                <CaseOption
                  key={c.id}
                  c={c}
                  selected={selectedCaseId === c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                />
              ))}
            </div>
          )}

          {eligible.length > 0 && (
            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpRight className="size-3" />
              Cases from other sites are hidden — incidents must share the same site.
            </p>
          )}
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedCaseId}
            onClick={() => selectedCaseId && onConfirm(selectedCaseId)}
          >
            Link to Case
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
