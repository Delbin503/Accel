import * as React from "react";
import {
  Info,
  Server,
  Cpu,
  Database,
  ShieldCheck,
  Cloud,
  Activity,
  ScrollText,
  ExternalLink,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

interface InfoItem {
  label: string;
  value: string;
  mono?: boolean;
  copy?: boolean;
}

interface InfoGroup {
  title: string;
  icon: React.ElementType;
  items: InfoItem[];
}

const INFO_GROUPS: InfoGroup[] = [
  {
    title: "Application",
    icon: Info,
    items: [
      { label: "Product",       value: "Accel TRMS" },
      { label: "Version",       value: "1.01.42-prod", mono: true, copy: true },
      { label: "Build ID",      value: "build-2026.05.28.8a4f12c", mono: true, copy: true },
      { label: "Release Date",  value: "28 May 2026" },
      { label: "Environment",   value: "Production" },
      { label: "Region",        value: "ap-southeast-1 (Singapore)" },
    ],
  },
  {
    title: "Backend Services",
    icon: Server,
    items: [
      { label: "API Endpoint",      value: "https://api.accel.ai/v2", mono: true, copy: true },
      { label: "API Version",       value: "v2.34.0", mono: true },
      { label: "Detection Engine",  value: "Sigmawave Vision · v4.2.1", mono: true },
      { label: "WebSocket Server",  value: "wss://stream.accel.ai", mono: true, copy: true },
      { label: "Inference Cluster", value: "8× NVIDIA L40S · auto-scaling" },
    ],
  },
  {
    title: "Storage & Recording",
    icon: Database,
    items: [
      { label: "Total Storage",   value: "120 TB" },
      { label: "Used Storage",    value: "68.4 TB (57%)" },
      { label: "Retention Policy", value: "90 days · auto-archive to cold storage" },
      { label: "Backup Schedule", value: "Daily · 02:00 SGT" },
      { label: "Last Backup",     value: "31 May 2026, 02:00:23" },
    ],
  },
  {
    title: "Models & Compute",
    icon: Cpu,
    items: [
      { label: "Deployed Models", value: "12 / 25" },
      { label: "Active Cameras",  value: "30 streaming" },
      { label: "Avg Inference",   value: "42 ms per frame" },
      { label: "GPU Utilization", value: "61%" },
      { label: "Daily Detections", value: "2,418 (last 24h)" },
    ],
  },
  {
    title: "Security & Compliance",
    icon: ShieldCheck,
    items: [
      { label: "TLS",                value: "TLS 1.3" },
      { label: "Data Encryption",   value: "AES-256 at rest" },
      { label: "SOC 2 Type II",     value: "Compliant · Audited 12 Mar 2026" },
      { label: "ISO 27001",         value: "Certified · Renewed 04 Apr 2026" },
      { label: "Last Security Audit", value: "12 Mar 2026" },
    ],
  },
  {
    title: "Infrastructure",
    icon: Cloud,
    items: [
      { label: "Cloud Provider",  value: "AWS · ap-southeast-1" },
      { label: "CDN",             value: "Cloudflare Enterprise" },
      { label: "Database Engine", value: "PostgreSQL 16 + TimescaleDB" },
      { label: "Cache",           value: "Redis 7.2 · Multi-AZ" },
      { label: "Message Queue",   value: "Apache Kafka · 3 brokers" },
    ],
  },
];

const SYSTEM_STATUS: { label: string; status: "operational" | "degraded" | "outage"; uptime: string }[] = [
  { label: "API Gateway",         status: "operational", uptime: "99.998%" },
  { label: "Detection Engine",    status: "operational", uptime: "99.971%" },
  { label: "Recording Pipeline",  status: "operational", uptime: "99.992%" },
  { label: "WebSocket Streams",   status: "operational", uptime: "99.994%" },
  { label: "Notifications",       status: "operational", uptime: "99.989%" },
];

function StatusBadge({ status }: { status: "operational" | "degraded" | "outage" }) {
  const cfg = {
    operational: { bg: "bg-success/15 border-success/30",        text: "text-success",      label: "Operational" },
    degraded:    { bg: "bg-warning/15 border-warning/30",        text: "text-warning",      label: "Degraded"    },
    outage:      { bg: "bg-sev-critical/15 border-sev-critical/30", text: "text-sev-critical", label: "Outage"      },
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider", cfg.bg, cfg.text)}>
      <span className={cn("size-1.5 rounded-full",
        status === "operational" ? "animate-pulse bg-success" : status === "degraded" ? "bg-warning" : "bg-sev-critical")} />
      {cfg.label}
    </span>
  );
}

function SectionCard({ title, icon: Icon, children, action }: {
  title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-3.5 text-primary" />
          </div>
          <h2 className="text-md font-bold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function copy(value: string) {
  navigator.clipboard?.writeText(value).then(
    () => toast.success("Copied to clipboard"),
    () => toast.error("Copy failed")
  );
}

export default function SystemInfoPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>System Info</PageHeader.Title>
          <PageHeader.Description>
            Application version, infrastructure details and live service status.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button variant="outline" className="gap-1.5">
            <ExternalLink className="size-3.5" />
            Status Page
          </Button>
          <Button variant="outline" className="gap-1.5">
            <ScrollText className="size-3.5" />
            Changelog
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <SectionCard title="Service Status" icon={Activity}>
        <p className="mb-3 inline-flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="size-3.5 text-success" />
          <span className="font-semibold text-success">All systems operational</span>
          <span className="text-muted-foreground">· Updated just now</span>
        </p>
        <div className="space-y-1.5">
          {SYSTEM_STATUS.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">Uptime · {s.uptime} over 30 days</p>
              </div>
              <StatusBadge status={s.status} />
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {INFO_GROUPS.map((group) => (
          <SectionCard key={group.title} title={group.title} icon={group.icon}>
            <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2.5">
              {group.items.map((item) => (
                <React.Fragment key={item.label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-foreground">
                    <span className={cn(item.mono && "font-mono text-xs")}>{item.value}</span>
                    {item.copy && (
                      <button onClick={() => copy(item.value)}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Copy className="size-3" />
                      </button>
                    )}
                  </dd>
                </React.Fragment>
              ))}
            </dl>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
