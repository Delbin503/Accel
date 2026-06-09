import * as React from "react";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  Smartphone,
  Globe,
  Clock,
  Moon,
  Sun,
  Monitor,
  Save,
  AlertTriangle,
  CheckCircle2,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/ThemeProvider";

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-md font-bold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border transition-colors",
        checked ? "border-primary bg-primary" : "border-border bg-muted"
      )}
    >
      <span className={cn("inline-block size-3.5 rounded-full bg-card shadow-sm transition-transform", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

function PrefRow({
  icon: Icon,
  title,
  description,
  control,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background px-3.5 py-3">
      <Icon className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

const TIMEZONES = [
  { value: "Asia/Singapore", label: "(GMT+08:00) Singapore" },
  { value: "Asia/Tokyo",     label: "(GMT+09:00) Tokyo" },
  { value: "Asia/Bangkok",   label: "(GMT+07:00) Bangkok" },
  { value: "Asia/Dubai",     label: "(GMT+04:00) Dubai" },
  { value: "Europe/London",  label: "(GMT+00:00) London" },
  { value: "America/New_York", label: "(GMT-05:00) New York" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文 (Chinese)" },
  { value: "ja", label: "日本語 (Japanese)" },
  { value: "ko", label: "한국어 (Korean)" },
];

const DATE_FORMATS = [
  { value: "dd-mmm-yyyy", label: "25 May 2026", sub: "DD Mmm YYYY" },
  { value: "yyyy-mm-dd",  label: "2026-05-25",  sub: "ISO 8601" },
  { value: "mm/dd/yyyy",  label: "05/25/2026",  sub: "US" },
  { value: "dd/mm/yyyy",  label: "25/05/2026",  sub: "EU" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [notifEmailIncidents, setNotifEmailIncidents] = React.useState(true);
  const [notifEmailWeekly, setNotifEmailWeekly] = React.useState(true);
  const [notifEmailDigest, setNotifEmailDigest] = React.useState(false);
  const [notifPushCritical, setNotifPushCritical] = React.useState(true);
  const [notifPushMentions, setNotifPushMentions] = React.useState(true);
  const [notifSound, setNotifSound] = React.useState(true);
  const [notifDesktop, setNotifDesktop] = React.useState(true);

  const [language, setLanguage] = React.useState("en");
  const [timezone, setTimezone] = React.useState("Asia/Singapore");
  const [dateFormat, setDateFormat] = React.useState("dd-mmm-yyyy");
  const [timeFormat, setTimeFormat] = React.useState<"24h" | "12h">("24h");

  const [autoPlayClips, setAutoPlayClips] = React.useState(true);
  const [denserTables, setDenserTables] = React.useState(false);

  function save() {
    toast.success("Settings saved", { description: "Your preferences have been updated." });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Settings</PageHeader.Title>
          <PageHeader.Description>
            Customize your dashboard experience — appearance, notifications and regional preferences.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button onClick={save} className="gap-1.5">
            <Save className="size-3.5" />
            Save Changes
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <SectionCard title="Appearance" description="Choose how the dashboard looks.">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: "light",  label: "Light",  icon: Sun     },
              { v: "dark",   label: "Dark",   icon: Moon    },
              { v: "system", label: "System", icon: Monitor },
            ] as { v: "light" | "dark" | "system"; label: string; icon: React.ElementType }[]).map(({ v, label, icon: Icon }) => {
              const active = v === "system" ? false : theme === v;
              return (
                <button
                  key={v}
                  onClick={() => v !== "system" && setTheme(v)}
                  disabled={v === "system"}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border bg-background px-3 py-4 transition-colors disabled:opacity-50",
                    active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <PrefRow icon={Bell} title="Denser tables" description="Reduce row spacing in lists and tables to show more at once." control={<Toggle checked={denserTables} onChange={setDenserTables} />} />
          <PrefRow icon={Bell} title="Auto-play recording clips" description="Play recordings automatically when opening the drawer." control={<Toggle checked={autoPlayClips} onChange={setAutoPlayClips} />} />
        </div>
      </SectionCard>

      <SectionCard title="Notifications" description="Choose where and when we should reach you.">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email Notifications</p>
        <div className="space-y-2">
          <PrefRow icon={Mail} title="Critical incidents" description="Email me when a Critical severity incident is detected." control={<Toggle checked={notifEmailIncidents} onChange={setNotifEmailIncidents} />} />
          <PrefRow icon={Mail} title="Weekly summary" description="Get a digest of detections, cases and SLA performance every Monday." control={<Toggle checked={notifEmailWeekly} onChange={setNotifEmailWeekly} />} />
          <PrefRow icon={Mail} title="Daily activity digest" description="Once-daily recap of activity at end-of-day." control={<Toggle checked={notifEmailDigest} onChange={setNotifEmailDigest} />} />
        </div>
        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Push & In-App</p>
        <div className="space-y-2">
          <PrefRow icon={Smartphone} title="Critical alerts" description="Push notification for any Critical detection or escalation." control={<Toggle checked={notifPushCritical} onChange={setNotifPushCritical} />} />
          <PrefRow icon={Bell} title="Mentions and case assignments" description="When you are assigned a case or @-mentioned in a note." control={<Toggle checked={notifPushMentions} onChange={setNotifPushMentions} />} />
          <PrefRow icon={Volume2} title="Notification sound" description="Play a chime when a Critical detection arrives." control={<Toggle checked={notifSound} onChange={setNotifSound} />} />
          <PrefRow icon={Monitor} title="Desktop notifications" description="Show OS-level notifications while the dashboard is open in the background." control={<Toggle checked={notifDesktop} onChange={setNotifDesktop} />} />
        </div>
      </SectionCard>

      <SectionCard title="Regional" description="Set your language, timezone and date format.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Globe className="size-3" />
              Language
            </label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none">
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="size-3" />
              Timezone
            </label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none">
              {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date Format</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DATE_FORMATS.map((f) => (
                <button key={f.value} onClick={() => setDateFormat(f.value)}
                  className={cn("rounded-md border px-2.5 py-2 text-left transition-colors",
                    dateFormat === f.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/40"
                  )}>
                  <p className={cn("text-sm font-semibold", dateFormat === f.value ? "text-primary" : "text-foreground")}>{f.label}</p>
                  <p className="text-2xs text-muted-foreground">{f.sub}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time Format</p>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { v: "24h", label: "23:59", sub: "24-hour" },
                { v: "12h", label: "11:59 PM", sub: "12-hour" },
              ] as { v: "24h" | "12h"; label: string; sub: string }[]).map((f) => (
                <button key={f.v} onClick={() => setTimeFormat(f.v)}
                  className={cn("rounded-md border px-2.5 py-2 text-left transition-colors",
                    timeFormat === f.v
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/40"
                  )}>
                  <p className={cn("text-sm font-semibold", timeFormat === f.v ? "text-primary" : "text-foreground")}>{f.label}</p>
                  <p className="text-2xs text-muted-foreground">{f.sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone" description="Irreversible account actions.">
        <div className="space-y-2">
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/[0.06] px-3.5 py-3">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-foreground">Sign out of all devices</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Revoke all active sessions. You will need to sign in again on every device.
              </p>
            </div>
            <Button variant="outline" className="border-warning/40 text-warning hover:bg-warning/10" onClick={() => toast.success("All sessions revoked")}>
              Sign out everywhere
            </Button>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-sev-critical/30 bg-sev-critical/[0.06] px-3.5 py-3">
            <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-sev-critical" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-foreground">Delete account</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Account deletion is permanent. Contact your organization owner to begin the off-boarding process.
              </p>
            </div>
            <Button variant="outline" disabled>Contact Owner</Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
