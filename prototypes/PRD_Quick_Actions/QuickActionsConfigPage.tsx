import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, Brain, Building2, Clock, Command, Database, ShieldCheck, Users, Video, Webhook } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { QuickActionsSection } from "./QuickActionsSection";

/* ──────────────────────────────────────────────────────────────────────────
   PROTOTYPE-ONLY. System Configuration with one extra section — Quick Actions.

   The nine real sections are stubs here on purpose: this prototype exists to
   review the Quick Actions controls, and the shipped page already covers the
   rest (see PRD_System_Configuration).
   ────────────────────────────────────────────────────────────────────────── */

type Section =
  | "quick-actions"
  | "general"
  | "user-access"
  | "sla"
  | "detection"
  | "camera-defaults"
  | "nvr-defaults"
  | "notifications"
  | "integrations"
  | "security";

const SECTIONS: {
  key: Section;
  label: string;
  icon: LucideIcon;
  description: string;
  built?: boolean;
}[] = [
  { key: "quick-actions",   label: "Quick Actions",    icon: Command,     description: "Palette actions, pins and behaviour", built: true },
  { key: "general",         label: "General",          icon: Building2,   description: "Organization, date & time" },
  { key: "user-access",     label: "User Access",      icon: Users,       description: "Role permissions matrix" },
  { key: "sla",             label: "SLA & Escalation", icon: Clock,       description: "Response targets per severity" },
  { key: "detection",       label: "Detection Engine", icon: Brain,       description: "Confidence thresholds, models" },
  { key: "camera-defaults", label: "Camera Defaults",  icon: Video,       description: "RTSP, codec, frame rate, recording" },
  { key: "nvr-defaults",    label: "NVR Defaults",     icon: Database,    description: "Channel cleanup, storage warnings" },
  { key: "notifications",   label: "Notifications",    icon: Bell,        description: "Default delivery channels" },
  { key: "integrations",    label: "Integrations",     icon: Webhook,     description: "Coming in a later update" },
  { key: "security",        label: "Security",         icon: ShieldCheck, description: "Auth policy & audit" },
];

export default function QuickActionsConfigPage() {
  const [section, setSection] = React.useState<Section>("quick-actions");
  const current = SECTIONS.find((s) => s.key === section);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>System Configuration</PageHeader.Title>
          <PageHeader.Description>
            Workspace-wide settings. This prototype builds out the Quick Actions section only.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        <nav className="flex flex-col gap-1 self-start rounded-xl border border-border bg-card p-1.5">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={cn(
                  "flex items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors duration-[var(--duration-fast)] ease-standard",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("mt-0.5 size-4 flex-shrink-0", active && "text-primary")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{s.label}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-2xs leading-snug",
                      active ? "text-primary/70" : "text-muted-foreground/70"
                    )}
                  >
                    {s.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {section === "quick-actions" ? (
            <QuickActionsSection />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card">
              <EmptyState
                icon={current?.icon}
                title={`${current?.label} is not part of this prototype`}
                description="Only the Quick Actions section is built here. The shipped controls live in the System Configuration prototype."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
