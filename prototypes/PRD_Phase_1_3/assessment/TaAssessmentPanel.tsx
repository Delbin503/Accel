import { useNavigate } from "react-router-dom";
import { ArrowRight, Radio } from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  GROUP_RESULTS, SESSION_STATUS_LABEL, TA_AREAS, USE_CASES, useDevicesStore, useSessionsStore,
  type SessionStatus, type UseCaseKey,
} from "./taData";
import { TA_RESULT_PATH, TA_ROUTES } from "./taNav";

/* Golf, Gym and Physio Assessment — one panel each on the customizable
   dashboard, so each can be placed or removed on its own and shows only its
   own use case: its sessions, top faults and what's live or coming up. Shown by default;
   like every panel it can be removed in Customize and dragged back from the
   drawer. Everything links to Performance & Posture. */

const STATUS_TONE: Record<SessionStatus, "info" | "critical" | "success"> = { scheduled: "info", live: "critical", complete: "success" };

export function TaUseCasePanel({ uc }: { uc: UseCaseKey }) {
  const navigate = useNavigate();
  const u = USE_CASES[uc];
  const g = GROUP_RESULTS[uc];
  const sessions = useSessionsStore((s) => s.sessions).filter((s) => s.useCase === uc);
  const areaIds = new Set(TA_AREAS.filter((a) => a.useCase === uc).map((a) => a.id));
  const devicesDown = useDevicesStore((s) => s.devices).filter((d) => areaIds.has(d.areaId) && d.status !== "online").length;

  const live = sessions.filter((s) => s.status === "live");
  const complete = sessions.filter((s) => s.status === "complete");
  const scheduled = sessions.filter((s) => s.status === "scheduled");
  const participants = new Set(sessions.flatMap((s) => s.participants.map((p) => p.name))).size;
  const upcoming = sessions
    .filter((s) => s.status === "live" || s.status === "scheduled")
    .sort((a, b) => ["live", "scheduled"].indexOf(a.status) - ["live", "scheduled"].indexOf(b.status))
    .slice(0, 3);
  const maxFault = Math.max(...g.faults.map(([, n]) => n));
  const go = (tab?: string) => navigate(tab ? `${TA_ROUTES.sessions}?tab=${tab}` : TA_ROUTES.sessions);
  const faultWord = uc === "physio" ? "compensations" : "faults";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-3 @4xl:grid-cols-4">
        <KpiCard label="Live sessions" value={live.length} sub={live[0] ? live[0].name : "None running"} accent="sev-critical" onClick={() => go()} />
        <KpiCard label="Total participants" value={participants} sub={`${u.people[0].toUpperCase()}${u.people.slice(1)} across all sessions`} accent="primary" onClick={() => go()} />
        <KpiCard label="Scheduled" value={scheduled.length} sub={scheduled[0] ? `Next: ${scheduled[0].date}` : "Nothing booked"} accent="info" onClick={() => go()} />
        <KpiCard label="Complete" value={complete.length} sub={`${complete.reduce((n, s) => n + s.flagged, 0)} flagged ${u.items}`} accent="success" onClick={() => go("results")} />
      </div>

      <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        {/* What the group gets wrong most */}
        <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-background p-3">
          <p className="text-2xs uppercase tracking-wider text-muted-foreground">Top {faultWord}</p>
          {g.faults.slice(0, 4).map(([name, n]) => (
            <div key={name}>
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <span className="truncate text-foreground">{name}</span>
                <span className="shrink-0 text-muted-foreground">{n} {n === 1 ? u.person : u.people}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-warning" style={{ width: `${(n / maxFault) * 100}%` }} /></div>
            </div>
          ))}
        </div>

        {/* Live and upcoming */}
        <div className="flex flex-col rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-semibold text-foreground">Live & upcoming</p>
            <button type="button" onClick={() => go()} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              All sessions <ArrowRight className="size-3" />
            </button>
          </div>
          <div className="flex-1 divide-y divide-border/60">
            {upcoming.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing live or scheduled.</p>
            ) : (
              upcoming.map((s) => (
                <button key={s.id} type="button" onClick={() => (s.status === "live" ? navigate(`${TA_RESULT_PATH}?session=${s.id}`) : go())}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                    <p className="truncate text-2xs text-muted-foreground">{s.date} · {s.time} · {s.participants.length} {u.people}</p>
                  </div>
                  <StatusBadge tone={STATUS_TONE[s.status]}>{SESSION_STATUS_LABEL[s.status]}</StatusBadge>
                </button>
              ))
            )}
          </div>
          {devicesDown > 0 && (
            <button type="button" onClick={() => navigate(TA_ROUTES.devices)}
              className="flex items-center gap-1.5 border-t border-border px-3 py-2 text-left text-xs text-warning transition-colors hover:bg-warning/[0.06]">
              <Radio className="size-3.5" />
              {devicesDown} external device{devicesDown === 1 ? "" : "s"} offline or pairing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
