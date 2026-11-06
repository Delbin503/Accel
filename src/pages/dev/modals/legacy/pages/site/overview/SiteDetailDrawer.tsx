/**
 * Frozen copy of src/pages/site/overview/SiteDetailDrawer.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/site/overview/SiteDetailDrawer.tsx.
 */
import * as React from "react";
import { Trash2, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimeSelect } from "@/components/shared/TimeSelect";
import { cn } from "@/lib/utils";
import { TIMEZONES, DEFAULT_TIMEZONE } from "@/lib/timezones";
import { AREA_PALETTE } from "@/mocks/sites";
import type { AreaShape, SiteData } from "@/types/sites";

/* ── Edit / Delete modals ────────────────────────────────────────────── */

export function EditAreaModal({ area, open, onClose, onSave }: { area: AreaShape | null; open: boolean; onClose: () => void; onSave: (patch: Partial<AreaShape>) => void }) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(AREA_PALETTE[0]);
  const [nameErr, setNameErr] = React.useState<string | null>(null);
  React.useEffect(() => { if (open && area) { setName(area.name); setColor(area.color); setNameErr(null); } }, [open, area]);
  if (!area) return null;
  const dirty = name !== area.name || color !== area.color;
  function handleSave() {
    if (!name.trim()) { setNameErr("Area name is required."); return; }
    onSave({ name: name.trim(), color });
  }
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Edit Area"
          description="Rename the area or change its accent on the floor plan."
        />
        <ModalBody className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area Name</label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (nameErr) setNameErr(null); }} aria-invalid={!!nameErr} className="h-9 text-base" />
            {nameErr && <p className="mt-1 text-xs text-sev-critical">{nameErr}</p>}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color</p>
            <div className="flex flex-wrap gap-1.5">
              {AREA_PALETTE.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn("relative size-7 rounded-md border-2 transition-colors",
                    color === c ? "border-foreground" : "border-transparent hover:border-foreground/30")}
                  style={{ background: c }}>
                  {color === c && <Check className="absolute inset-0 m-auto size-3.5 text-white drop-shadow" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!dirty} onClick={handleSave} className="gap-1.5">
            <Save className="size-3.5" />
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** Fallback window for sites seeded before operating hours existed. */
const DEFAULT_OPERATING_HOURS = { from: "08:00", to: "18:00" };

export function EditSiteModal({ site, open, onClose, onSave }: { site: SiteData | null; open: boolean; onClose: () => void; onSave: (patch: Partial<SiteData>) => void }) {
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [timezone, setTimezone] = React.useState(DEFAULT_TIMEZONE);
  const [opFrom, setOpFrom] = React.useState(DEFAULT_OPERATING_HOURS.from);
  const [opTo, setOpTo] = React.useState(DEFAULT_OPERATING_HOURS.to);
  const [errors, setErrors] = React.useState<{ name?: string; address?: string }>({});
  React.useEffect(() => {
    if (open && site) {
      setName(site.name); setAddress(site.address); setDescription(site.description ?? ""); setTimezone(site.timezone);
      setOpFrom(site.operatingHours?.from ?? DEFAULT_OPERATING_HOURS.from);
      setOpTo(site.operatingHours?.to ?? DEFAULT_OPERATING_HOURS.to);
      setErrors({});
    }
  }, [open, site]);
  if (!site) return null;
  const dirty = name !== site.name || address !== site.address || description !== (site.description ?? "") || timezone !== site.timezone
    || opFrom !== (site.operatingHours?.from ?? DEFAULT_OPERATING_HOURS.from)
    || opTo !== (site.operatingHours?.to ?? DEFAULT_OPERATING_HOURS.to);
  function handleSave() {
    const next: { name?: string; address?: string } = {};
    if (!name.trim()) next.name = "Site name is required.";
    if (!address.trim()) next.address = "Site address is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSave({ name: name.trim(), address: address.trim(), description: description.trim() || undefined, timezone, operatingHours: { from: opFrom, to: opTo } });
  }
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Edit Site"
          description="Update the site's name, address, timezone and operating hours."
        />
        <ModalBody className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Site Name</label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
              aria-invalid={!!errors.name} placeholder="e.g. Astra HQ" className="h-9 text-base" />
            {errors.name && <p className="mt-1 text-xs text-sev-critical">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</label>
            <Input value={address} onChange={(e) => { setAddress(e.target.value); if (errors.address) setErrors((p) => ({ ...p, address: undefined })); }}
              aria-invalid={!!errors.address} placeholder="8 Marina Boulevard, Singapore 018984" className="h-9 text-base" />
            {errors.address && <p className="mt-1 text-xs text-sev-critical">{errors.address}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timezone</label>
            <Select value={timezone} onValueChange={(v) => setTimezone(v)}>
              <SelectTrigger className="h-9 w-full text-base">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-72">
                {TIMEZONES.map((tz) => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operating Hours</label>
            <div className="flex items-center gap-2">
              <TimeSelect value={opFrom} onChange={setOpFrom} aria-label="Opening time" className="min-w-0 flex-1" />
              <span className="text-sm text-muted-foreground">to</span>
              <TimeSelect value={opTo} onChange={setOpTo} aria-label="Closing time" className="min-w-0 flex-1" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground/70">Daily window when this site is operational.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description (Optional)</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="A short description of this site…"
              className="w-full text-base" />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!dirty} onClick={handleSave} className="gap-1.5">
            <Save className="size-3.5" />
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function DeleteSiteModal({ site, open, onClose, onConfirm }: { site: SiteData | null; open: boolean; onClose: () => void; onConfirm: () => void }) {
  const [confirm, setConfirm] = React.useState("");
  React.useEffect(() => { if (open) setConfirm(""); }, [open]);
  if (!site) return null;
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={<>Delete {site.name}?</>}
          description="This action cannot be undone."
          tone="destructive"
        />
        <ModalBody className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This will permanently remove the site, its <strong className="text-foreground">{site.areas.length}</strong> area{site.areas.length === 1 ? "" : "s"} and floor plan.
            Cameras assigned to this site will remain in the Cameras module but will be unassigned.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Type <span className="font-mono normal-case text-foreground">{site.name}</span> to confirm
            </label>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-9 text-base" />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={confirm.trim() !== site.name}
            onClick={onConfirm}
            className="gap-1.5 border-sev-critical/40 bg-sev-critical/15 text-sev-critical hover:bg-sev-critical/25">
            <Trash2 className="size-3.5" />
            Delete Site
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
