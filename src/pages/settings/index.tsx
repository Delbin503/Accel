import * as React from "react";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  Smartphone,
  Moon,
  Sun,
  Monitor,
  Save,
  AlertTriangle,
  Volume2,
  Trash2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuthStore } from "@/stores/useAuthStore";
import { MOCK_USERS } from "@/mocks/users";

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

/** Typed-confirmation gate — the owner's delete is irreversible and unrecoverable. */
const DELETE_PHRASE = "DELETE";

/* Mounted only while open (see the call site), so the typed confirmation starts
   empty on every open without needing a reset effect. */
function DeleteAccountModal({
  onClose,
  orgName,
}: {
  onClose: () => void;
  orgName: string;
}) {
  const [typed, setTyped] = React.useState("");

  const canDelete = typed.trim() === DELETE_PHRASE;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[520px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2.5 text-base font-bold">
            <Trash2 className="size-4 text-sev-critical" />
            Delete account
          </DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            This permanently deletes <strong className="text-foreground">{orgName}</strong> and
            everything in it. It cannot be undone.
          </p>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          <div className="flex items-start gap-2 rounded-lg border border-sev-critical/30 bg-sev-critical/[0.06] px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-sev-critical" />
            <ul className="space-y-1 text-sm text-foreground">
              <li>All sites, cameras and NVR links are removed.</li>
              <li>Deployed models stop and their detection history is deleted.</li>
              <li>Every member loses access immediately.</li>
              <li>Active subscriptions are cancelled without refund.</li>
            </ul>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Type <span className="font-mono text-foreground">{DELETE_PHRASE}</span> to confirm
            </label>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={DELETE_PHRASE}
              autoComplete="off"
              className="h-9 font-mono text-base"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={!canDelete}
            onClick={() => {
              onClose();
              toast.success("Account scheduled for deletion", {
                description: "You have 30 days to cancel before data is erased.",
              });
            }}
            className="gap-1.5"
          >
            <Trash2 className="size-3.5" />
            Delete account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const authUser = useAuthStore((s) => s.user);

  /* Danger Zone is role-gated: only an owner can actually delete the account. */
  const isOwner = authUser?.role === "owner";
  const owner = React.useMemo(() => MOCK_USERS.find((u) => u.role === "owner"), []);
  const ownerName = owner?.fullName ?? "your organization owner";
  const ownerEmail = owner?.email ?? "owner@your-org.com";
  const orgName = authUser?.orgName ?? "this workspace";
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [requestSent, setRequestSent] = React.useState(false);

  const [notifEmailIncidents, setNotifEmailIncidents] = React.useState(true);
  const [notifEmailWeekly, setNotifEmailWeekly] = React.useState(true);
  const [notifEmailDigest, setNotifEmailDigest] = React.useState(false);
  const [notifPushCritical, setNotifPushCritical] = React.useState(true);
  const [notifPushMentions, setNotifPushMentions] = React.useState(true);
  const [notifSound, setNotifSound] = React.useState(true);
  const [notifDesktop, setNotifDesktop] = React.useState(true);

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
          {/* Owners delete the account outright; everyone else can only ask them to. */}
          <div className="flex items-start gap-3 rounded-lg border border-sev-critical/30 bg-sev-critical/[0.06] px-3.5 py-3">
            <Trash2 className="mt-0.5 size-4 flex-shrink-0 text-sev-critical" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-foreground">
                {isOwner ? "Delete account" : "Request account deletion"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isOwner ? (
                  <>
                    Permanently deletes the workspace, its sites and every member's access. This
                    cannot be undone.
                  </>
                ) : (
                  <>
                    Only the organization owner can delete an account. We'll email{" "}
                    <strong className="text-foreground">{ownerEmail}</strong> to start the
                    off-boarding process.
                  </>
                )}
              </p>
            </div>
            {isOwner ? (
              <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-1.5">
                <Trash2 className="size-3.5" />
                Delete account
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled={requestSent}
                onClick={() => {
                  setRequestSent(true);
                  toast.success("Deletion request sent", {
                    description: `${ownerName} has been emailed at ${ownerEmail}.`,
                  });
                }}
                className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10 hover:text-sev-critical"
              >
                <Send className="size-3.5" />
                {requestSent ? "Request sent" : "Request deletion"}
              </Button>
            )}
          </div>
        </div>
      </SectionCard>

      {deleteOpen && <DeleteAccountModal onClose={() => setDeleteOpen(false)} orgName={orgName} />}
    </div>
  );
}
