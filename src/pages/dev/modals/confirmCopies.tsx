import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import { MOCK_CAMERAS } from "@/mocks/cameras";
import { MOCK_RECORDINGS } from "@/mocks/recordings";
import type { DayRecording } from "@/mocks/dayRecordings";
import type { SiteData } from "@/types/sites";
import type { NvrData } from "@/types/nvr";
import type { UserData } from "@/types/users";
import type { DismissedEvent } from "@/types/detection";

/**
 * Gallery-only copies of the app's confirm modals, used to try a unified look
 * before touching the pages. Wording and buttons follow each module's modal;
 * what differs:
 *   - titles are neutral, nothing carries an icon, and there is no Cancel —
 *     the ✕ (or Esc) closes;
 *   - every confirm is the same width (550px — 1.25× the shell's 440px confirm size);
 *   - the body is one short sentence (about two lines) naming what's affected,
 *     plus any field the action needs; no boxes.
 * The pages still render their own versions.
 */

type Close = { onClose: () => void };

const BODY = "space-y-4";
const NOTE = "text-sm leading-relaxed text-muted-foreground";
const FIELD_LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/** Shared frame: same width, neutral title, one action. Close with the ✕ or Esc. */
function ConfirmFrame({
  title,
  destructive = false,
  confirmLabel,
  confirmDisabled,
  onClose,
  extraAction,
  children,
}: Close & {
  title: React.ReactNode;
  destructive?: boolean;
  confirmLabel: React.ReactNode;
  confirmDisabled?: boolean;
  /** A secondary action shown before the main one (e.g. "Export & Unlink"). */
  extraAction?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Modal open onOpenChange={(v) => !v && onClose()}>
      {/* 550px: the shell's confirm size (440) × 1.25 — between its sm and lg widths. */}
      <ModalContent size="sm" className="w-[550px]">
        {/* Titles stay neutral; the red action button carries the danger. */}
        <ModalHeader title={title} description={null} />
        {children ? <ModalBody className={BODY}>{children}</ModalBody> : null}
        <ModalFooter>
          {extraAction}
          <Button
            size="sm"
            variant={destructive ? "destructive" : "default"}
            disabled={confirmDisabled}
            onClick={onClose}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Deploy · Run Analysis ─────────────────────────────────────────────── */

export function DeleteAnalysisCopy({ name, onClose }: Close & { name: string }) {
  return (
    <ConfirmFrame title="Delete Analysis" destructive confirmLabel="Delete Analysis" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to delete <strong className="text-foreground">{name}</strong>? Its validation history references go too.
      </p>
    </ConfirmFrame>
  );
}

/* ── Site · Overview ───────────────────────────────────────────────────── */

export function DeleteSiteCopy({ site, onClose }: Close & { site: SiteData }) {
  const [typed, setTyped] = React.useState("");
  const areas = site.areas.length;
  return (
    <ConfirmFrame
      title={`Delete ${site.name}?`}
      destructive
      confirmLabel="Delete Site"
      confirmDisabled={typed.trim() !== site.name}
      onClose={onClose}
    >
      <p className={NOTE}>
        Are you sure you want to delete <strong className="text-foreground">{site.name}</strong>? Its <strong className="text-foreground">{areas}</strong> area
        {areas === 1 ? "" : "s"} and floor plan go too; its cameras stay, unassigned.
      </p>
      <div>
        <label className={FIELD_LABEL}>
          Type <span className="font-mono normal-case text-foreground">{site.name}</span> to confirm
        </label>
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} className="h-9 text-base" />
      </div>
    </ConfirmFrame>
  );
}

/* ── Site · Cameras ────────────────────────────────────────────────────── */

export function UndeployModelCopy({ cameraName, modelName, onClose }: Close & {
  cameraName: string;
  modelName: string;
}) {
  return (
    <ConfirmFrame title="Undeploy Model" confirmLabel="Undeploy" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to undeploy <strong className="text-foreground">{modelName}</strong> from <strong className="text-foreground">{cameraName}</strong>? It stops
        producing detection events.
      </p>
    </ConfirmFrame>
  );
}

/* ── Site · NVR ────────────────────────────────────────────────────────── */

export function DeleteNvrCopy({ nvr, onClose }: Close & { nvr: NvrData }) {
  return (
    <ConfirmFrame title="Delete NVR" destructive confirmLabel="Delete NVR" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to delete <strong className="text-foreground">{nvr.name}</strong>? Its <strong className="text-foreground">{nvr.channelsInUse}</strong> cameras lose
        storage and {nvr.usedStorageGb.toLocaleString()} GB of recordings can&apos;t be recovered.
      </p>
    </ConfirmFrame>
  );
}

export function UnlinkCameraCopy({ nvr, channel, onClose }: Close & { nvr: NvrData; channel: number }) {
  const [exportFirst, setExportFirst] = React.useState(true);
  const id = React.useId();
  const ch = nvr.channels.find((c) => c.channel === channel);
  if (!ch) return null;
  const cam = ch.cameraId ? MOCK_CAMERAS.find((c) => c.id === ch.cameraId) : null;
  const recs = ch.cameraId ? MOCK_RECORDINGS.filter((r) => r.nvrId === nvr.id && r.cameraId === ch.cameraId) : [];
  const storageGb = (Math.round((recs.reduce((t, r) => t + r.fileSizeMb, 0) / 1024) * 100) / 100).toFixed(2);
  return (
    <ConfirmFrame
      title="Unlink Camera"
      destructive
      confirmLabel="Unlink without Export"
      onClose={onClose}
      extraAction={
        exportFirst ? (
          <Button variant="outline" size="sm" onClick={onClose}>Export &amp; Unlink</Button>
        ) : null
      }
    >
      <p className={NOTE}>
        Are you sure you want to unlink <strong className="text-foreground">{cam?.name ?? ch.cameraName ?? "this camera"}</strong>? Recording
        stops; its {recs.length} files ({storageGb} GB) stay until retention ends.
      </p>
      <div className="flex items-center gap-2.5">
        <Checkbox id={id} checked={exportFirst} onCheckedChange={(v) => setExportFirst(v === true)} />
        <label htmlFor={id} className="cursor-pointer text-sm text-foreground">
          Export recordings before unlinking
        </label>
      </div>
    </ConfirmFrame>
  );
}

/* ── Manage · Model Management / Rules Library ─────────────────────────── */

export function DeleteNamedCopy({ kind, name, references, onClose }: Close & {
  /** "Model" or "Rule". */
  kind: string;
  name: string;
  /** Who points at it, e.g. "deployments". */
  references: string;
}) {
  const Refs = references.charAt(0).toUpperCase() + references.slice(1);
  return (
    <ConfirmFrame title={`Delete ${kind}`} destructive confirmLabel={`Delete ${kind}`} onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to delete <strong className="text-foreground">{name}</strong>? {Refs} that reference it will need updating.
      </p>
    </ConfirmFrame>
  );
}

/* ── Manage · Incident Cases ───────────────────────────────────────────── */

export function DeleteCaseCopy({ caseTitle, onClose }: Close & { caseTitle: string }) {
  return (
    <ConfirmFrame title="Delete Case" destructive confirmLabel="Delete Case" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to delete <strong className="text-foreground">{caseTitle}</strong>? Its incident links go too; detection events
        stay.
      </p>
    </ConfirmFrame>
  );
}

/* ── Monitor · Recordings ──────────────────────────────────────────────── */

export function DeleteRecordingsCopy({ recs, onClose }: Close & { recs: DayRecording[] }) {
  if (recs.length === 0) return null;
  const isBulk = recs.length > 1;
  return (
    <ConfirmFrame
      title={isBulk ? `Delete Recordings (${recs.length})` : "Delete Recording"}
      destructive
      confirmLabel={`Delete ${recs.length} Recording${recs.length === 1 ? "" : "s"}`}
      onClose={onClose}
    >
      <p className={NOTE}>
        Are you sure you want to delete{" "}
        <strong className="text-foreground">{isBulk ? `${recs.length} recordings` : recs[0].cameraName}</strong>? This can&apos;t be undone.
      </p>
    </ConfirmFrame>
  );
}

/* ── Monitor · Detection Feed ──────────────────────────────────────────── */

export function RestoreDismissedCopy({ items, onClose }: Close & { items: DismissedEvent[] }) {
  const n = items.length;
  return (
    <ConfirmFrame title="Restore dismissed events?" confirmLabel={`Restore ${n}`} onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to restore <strong className="text-foreground">{n} event{n === 1 ? "" : "s"}</strong> to the Detection Feed?
      </p>
    </ConfirmFrame>
  );
}

/* ── System · User Management ──────────────────────────────────────────── */

export function ReinstateUserCopy({ user, onClose }: Close & { user: UserData }) {
  return (
    <ConfirmFrame title="Reinstate User" confirmLabel="Reinstate" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to reinstate <strong className="text-foreground">{user.fullName}</strong>? They regain access on next sign-in
        with their existing role.
      </p>
    </ConfirmFrame>
  );
}

export function DeleteUserCopy({ user, onClose }: Close & { user: UserData }) {
  const [note, setNote] = React.useState("");
  return (
    <ConfirmFrame title="Delete User" destructive confirmLabel="Delete User" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to delete <strong className="text-foreground">{user.fullName}</strong>? Audit history is kept; re-invite them to
        restore access.
      </p>
      <div>
        <label className={FIELD_LABEL}>Note (Optional)</label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for permanent deletion — preserved in the audit log."
          rows={3}
        />
      </div>
    </ConfirmFrame>
  );
}

export function ResetTwoFaCopy({ user, onClose }: Close & { user: UserData }) {
  return (
    <ConfirmFrame title="Reset 2FA" confirmLabel="Reset 2FA" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to reset 2FA for <strong className="text-foreground">{user.fullName}</strong>? Their authenticator stops now; they
        re-enrol at next sign-in.
      </p>
    </ConfirmFrame>
  );
}

/* ── Account · Settings ────────────────────────────────────────────────── */

const DELETE_PHRASE = "DELETE";

export function DeleteAccountCopy({ orgName, onClose }: Close & { orgName: string }) {
  const [typed, setTyped] = React.useState("");
  return (
    <ConfirmFrame
      title="Delete account"
      destructive
      confirmLabel="Delete account"
      confirmDisabled={typed.trim() !== DELETE_PHRASE}
      onClose={onClose}
    >
      <p className={NOTE}>
        Are you sure you want to delete <strong className="text-foreground">{orgName}</strong>? Everything in it is erased, members lose access,
        and subscriptions aren&apos;t refunded.
      </p>
      <div>
        <label className={FIELD_LABEL}>
          Type <span className="font-mono text-foreground">{DELETE_PHRASE}</span> to confirm
        </label>
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={DELETE_PHRASE} autoComplete="off" />
      </div>
    </ConfirmFrame>
  );
}

/* ── Shared · ConfirmDialog ────────────────────────────────────────────── */

export function ConfirmDialogCopy({ onClose }: Close) {
  return (
    <ConfirmFrame title="Restore 3 events?" confirmLabel="Restore" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to restore <strong className="text-foreground">3 events</strong> to the live detection feed? They stay counted
        against this site&apos;s usage.
      </p>
    </ConfirmFrame>
  );
}

export function ConfirmDialogDestructiveCopy({ recs, onClose }: Close & { recs: DayRecording[] }) {
  const n = recs.length;
  return (
    <ConfirmFrame title={`Delete ${n} recording${n === 1 ? "" : "s"}?`} destructive confirmLabel="Delete" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to delete <strong className="text-foreground">{n} recording{n === 1 ? "" : "s"}</strong>? This can&apos;t be
        undone.
      </p>
    </ConfirmFrame>
  );
}

/* ── Inline confirms (built with ConfirmDialog inside a page) ──────────── */

export function SignOutCopy({ onClose }: Close) {
  return (
    <ConfirmFrame title="Sign out?" destructive confirmLabel="Sign Out" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to sign out? You&apos;ll return to the sign-in screen on this device.
      </p>
    </ConfirmFrame>
  );
}

export function RemoveModelCopy({ modelName, cameras, activeCount, onClose }: Close & {
  modelName: string;
  cameras: number;
  /** How many of the selected deployments are still running. */
  activeCount: number;
}) {
  const plural = cameras === 1 ? "" : "s";
  return (
    <ConfirmFrame
      title={`Remove ${modelName}?`}
      destructive
      confirmLabel={`Remove ${cameras} Camera${plural}`}
      onClose={onClose}
    >
      <p className={NOTE}>
        Are you sure you want to remove <strong className="text-foreground">{modelName}</strong> from{" "}
        <strong className="text-foreground">{cameras} camera{plural}</strong>?{" "}
        {activeCount > 0
          ? `Detection stops on the ${activeCount} still running, and their records are deleted.`
          : "Their deployment records are deleted."}
      </p>
    </ConfirmFrame>
  );
}

export function RemoveFloorPlanCopy({ siteName, onClose }: Close & { siteName: string }) {
  return (
    <ConfirmFrame title="Remove floor plan?" destructive confirmLabel="Remove" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to remove the floor plan for <strong className="text-foreground">{siteName}</strong>?
        Areas and camera positions stay saved.
      </p>
    </ConfirmFrame>
  );
}

export function CancelSubscriptionCopy({ plan, renews, sites, onClose }: Close & {
  plan: string;
  renews: string;
  sites: number;
}) {
  return (
    <ConfirmFrame title="Cancel subscription?" destructive confirmLabel="Cancel subscription" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to cancel <strong className="text-foreground">{plan}</strong>? It stays active until{" "}
        <strong className="text-foreground">{renews}</strong>, then all {sites} sites are suspended.
      </p>
    </ConfirmFrame>
  );
}

export function ResumeSubscriptionCopy({ plan, renews, total, onClose }: Close & {
  plan: string;
  renews: string;
  /** e.g. "$1,499/month". */
  total: string;
}) {
  return (
    <ConfirmFrame title="Resume subscription?" confirmLabel="Resume subscription" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to resume <strong className="text-foreground">{plan}</strong>? It renews on{" "}
        <strong className="text-foreground">{renews}</strong> at <strong className="text-foreground">{total}</strong>.
      </p>
    </ConfirmFrame>
  );
}

export function EndSubscriptionCopy({ plan, renews, onClose }: Close & { plan: string; renews: string }) {
  return (
    <ConfirmFrame title="End subscription now?" destructive confirmLabel="End now" onClose={onClose}>
      <p className={NOTE}>
        Are you sure you want to end <strong className="text-foreground">{plan}</strong> today instead of on {renews}?
        There&apos;s no refund for the remaining period.
      </p>
    </ConfirmFrame>
  );
}
