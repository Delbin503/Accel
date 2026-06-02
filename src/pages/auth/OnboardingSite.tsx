import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight, ArrowLeft, Building2, MapPin, Globe2, Plus, Trash2, Check, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "./AuthLayout";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { AREA_PALETTE } from "@/mocks/sites";
import type { AreaShape, SiteData } from "@/types/sites";
import { cn } from "@/lib/utils";
import { OnboardingProgress } from "./OnboardingProgress";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function OnboardingSitePage() {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const setHasCreatedSite = useAuthStore((s) => s.setHasCreatedSite);
  const addSite = useSitesStore((s) => s.addSite);

  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Singapore");
  const [areas, setAreas] = React.useState<AreaShape[]>([
    { id: uid("area"), name: "Lobby",     color: AREA_PALETTE[0], points: [] },
    { id: uid("area"), name: "Entrance",  color: AREA_PALETTE[1], points: [] },
  ]);
  const [error, setError] = React.useState<string | null>(null);

  function addArea() {
    const idx = areas.length % AREA_PALETTE.length;
    setAreas((a) => [...a, { id: uid("area"), name: `Area ${a.length + 1}`, color: AREA_PALETTE[idx], points: [] }]);
  }

  function removeArea(id: string) {
    setAreas((a) => a.filter((x) => x.id !== id));
  }

  function renameArea(id: string, newName: string) {
    setAreas((a) => a.map((x) => (x.id === id ? { ...x, name: newName } : x)));
  }

  function submit() {
    setError(null);
    if (!name.trim()) { setError("Give your site a name."); return; }
    if (!address.trim()) { setError("Add an address so detections can be located."); return; }
    if (areas.length === 0) { setError("Add at least one area to monitor."); return; }
    if (areas.some((a) => !a.name.trim())) { setError("Each area needs a name."); return; }

    const site: SiteData = {
      id: uid("site"),
      name: name.trim(),
      address: address.trim(),
      timezone,
      description: `${authUser?.orgName ?? "Workspace"} primary site`,
      status: "setup",
      floorPlan: null,
      areas: areas.map((a) => ({ ...a, name: a.name.trim() })),
      cameraPlacements: {},
      createdAt: new Date("2026-06-01T15:00:00").toISOString(),
      createdAtDisplay: "01 Jun 2026",
      accent: AREA_PALETTE[0],
    };
    addSite(site);
    setHasCreatedSite(true);
    toast.success(`Site "${site.name}" created`, {
      description: `${areas.length} area${areas.length === 1 ? "" : "s"} added. Next: choose a plan.`,
    });
    navigate("/onboarding/subscription", { replace: true });
  }

  return (
    <AuthLayout
      brandSlot={
        <>
          <h2 className="text-[28px] font-bold leading-tight text-foreground">
            Set up your first site.
          </h2>
          <p className="text-[13px] text-muted-foreground">
            A <strong className="text-foreground">site</strong> is a physical location — an office, warehouse, base or store.
            Cameras, areas and detections all live under their parent site, and each site gets its own subscription.
          </p>
          <ul className="space-y-3 text-[13px] text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-3.5 flex-shrink-0 text-success" />
              <span>You can add more sites later — there's no limit.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-3.5 flex-shrink-0 text-success" />
              <span>Areas are zones inside the site (loading bay, lobby, perimeter).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-3.5 flex-shrink-0 text-success" />
              <span>You'll wire cameras and floor plans after onboarding.</span>
            </li>
          </ul>
        </>
      }
    >
      <div>
        <OnboardingProgress current="site" />

        <h1 className="text-[24px] font-bold tracking-tight text-foreground">Create your first site</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Add basic details and the areas you want to monitor.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Site name
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Astra HQ, FedEx Changi" className="h-10 pl-9 text-[13px]" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Address
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Anson Road, Singapore 079914" className="h-10 pl-9 text-[13px]" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Timezone
            </label>
            <div className="relative">
              <Globe2 className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-[13px] text-foreground focus:border-primary focus:outline-none">
                <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                <option value="Asia/Jakarta">Asia/Jakarta (GMT+7)</option>
                <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (GMT+8)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (GMT-8)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Areas <span className="text-muted-foreground/60">(at least 1 required)</span>
              </label>
              <button onClick={addArea}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline">
                <Plus className="size-3" />
                Add area
              </button>
            </div>
            <div className="space-y-1.5">
              {areas.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
                  <span className="size-3 flex-shrink-0 rounded-full" style={{ background: a.color }} />
                  <Input value={a.name} onChange={(e) => renameArea(a.id, e.target.value)}
                    placeholder="Area name" className="h-8 flex-1 border-0 bg-transparent text-[13px] focus-visible:ring-0" />
                  <button onClick={() => removeArea(a.id)}
                    disabled={areas.length === 1}
                    className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-sev-critical disabled:opacity-30"
                    title="Remove area">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2 text-[12px] text-sev-critical">
              <AlertCircle className="size-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button variant="ghost" onClick={() => navigate("/signin")} className="gap-1.5">
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </Button>
            <Button className="ml-auto h-10 gap-2 px-5 text-[13px]" onClick={submit}>
              Continue
              <ArrowRight className="size-3.5" />
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Step 1 of 2 · After this, choose a plan to unlock the dashboard.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

// Re-export AREA_PALETTE for usage elsewhere
export { AREA_PALETTE };

// Avoid unused warning
void cn;
