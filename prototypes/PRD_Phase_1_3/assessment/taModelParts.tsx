import { ClipboardList, Target } from "lucide-react";
import { USE_CASES } from "./taData";
import type { AssessmentInfo } from "./taModels";

/* Assessment pieces of Model Management: the basic info a Training Assessment
   model carries — its use case and the activities it assesses — as a
   read-only summary (model detail). Edit Model doesn't change them. */

/* ── Read-only summary under the description ───────────────────────────── */

export function AssessmentSummary({ info }: { info: AssessmentInfo }) {
  const uc = USE_CASES[info.useCase];
  return (
    <div data-slot="assessment-summary" className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[180px_1fr]">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Use case</p>
        <p className="mt-0.5 text-base font-semibold text-foreground">{uc.full}</p>
        <p className="text-xs text-muted-foreground">
          Assesses {uc.people} · per {uc.unit}
        </p>
      </div>
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Activities · {info.activities.length}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {info.activities.map((a) => (
            <span key={a} className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-ink">{a}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── View-mode column: what the model measures ─────────────────────────── */

export function AssessmentCriteriaColumn({ info }: { info: AssessmentInfo }) {
  const uc = USE_CASES[info.useCase];
  return (
    <div data-slot="assessment-criteria-column" className="h-[460px] space-y-3 overflow-y-auto pr-1">
      <div className="rounded-xl border border-border bg-background p-3">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Target className="size-4 text-primary-ink" />
          Criteria
        </p>
        <div className="divide-y divide-border/60">
          {uc.criteria.map(([name, target]) => (
            <div key={name} className="flex items-center justify-between gap-3 py-1.5 text-sm">
              <span className="text-foreground">{name}</span>
              <span className="font-mono text-xs text-muted-foreground">{target}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-background p-3">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <ClipboardList className="size-4 text-primary-ink" />
          {info.useCase === "physio" ? "Compensations to detect" : "Faults to detect"}
        </p>
        <div className="flex flex-wrap gap-1">
          {uc.faults.map((f) => (
            <span key={f} className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">{f}</span>
          ))}
        </div>
      </div>
      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        Assessment models are scored against these criteria, so they need no detection rules. Pose mode, frame rate and the
        cameras each {uc.unit} needs are set in System Configuration › Camera Defaults.
      </p>
    </div>
  );
}
