import * as React from "react";
import { Search } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@accel/ui/components/shared/Modal";
import { Button } from "@accel/ui/components/ui/button";
import { Input } from "@accel/ui/components/ui/input";
import { Checkbox } from "@accel/ui/components/ui/checkbox";
import { cn } from "@accel/ui/lib/utils";
import { useIncidentCasesStore } from "@/stores/useIncidentCasesStore";
import { SeverityBadge } from "@/pages/detection-feed/shared";

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

const STATUS_LABEL: Record<string, string> = { open: "Open", "in-review": "In review" };

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

  // Reset the picker each time the modal opens (adjusted during render rather
  // than in an effect).
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedCaseId(null);
      setQuery("");
    }
  }

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
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader title="Link to Incident Case" />
        <ModalBody className="space-y-4">
          <p data-slot="link-case-modal-intro" className="text-sm leading-relaxed text-muted-foreground">
            Link{" "}
            <strong className="text-foreground">
              {eventIds.length > 1 ? `${eventIds.length} events` : eventIds[0]}
            </strong>{" "}
            to an open case at <strong className="text-foreground">{eventSiteDisplay}</strong>. Only cases from the same
            site are shown.
          </p>

          {eligible.length === 0 ? (
            <p data-slot="link-case-modal-empty" className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No open cases at {eventSiteDisplay}. Escalate to create one instead.
            </p>
          ) : (
            <>
              <div data-slot="link-case-modal-search" className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by case ID, title, or owner…"
                  className="h-9 pl-9 text-base"
                />
              </div>
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No cases match &ldquo;{query}&rdquo;.</p>
              ) : (
                /* One list with a checkbox per case. A link goes to one case, so ticking
                   a case unticks any other (and ticking it again clears the pick). */
                <ul className="max-h-72 divide-y divide-border/60 overflow-y-auto rounded-lg border border-border">
                  {filtered.map((c) => {
                    const on = selectedCaseId === c.id;
                    return (
                      <li key={c.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-3 px-3 py-3 transition-colors duration-[var(--duration-fast)] ease-standard",
                            on ? "bg-accent" : "hover:bg-muted/40"
                          )}
                        >
                          <Checkbox
                            checked={on}
                            onCheckedChange={(v) => setSelectedCaseId(v === true ? c.id : null)}
                            aria-label={`Link to ${c.id}`}
                            className="mt-0.5"
                          />
                          <span className="min-w-0 flex-1 space-y-1">
                            <span className="flex items-center justify-between gap-3">
                              <span className={cn("truncate text-sm font-medium", on ? "text-primary-ink" : "text-foreground")}>
                                {c.title}
                              </span>
                              <SeverityBadge severity={c.severity} />
                            </span>
                            <span className="block font-mono text-2xs text-muted-foreground">
                              {c.id} · {STATUS_LABEL[c.status] ?? c.status} · {c.assignedTo.name} ·{" "}
                              {c.incidentIds.length} incident{c.incidentIds.length === 1 ? "" : "s"}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button size="sm" disabled={!selectedCaseId} onClick={() => selectedCaseId && onConfirm(selectedCaseId)}>
            Link to Case
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
