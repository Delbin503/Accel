import * as React from "react";
import { Trash2, TriangleAlert, AlertTriangle, Check, RotateCcw, X } from "lucide-react";
import {
  PLAN, RENEWS, SITE_COUNT, MONTHLY_TOTAL, REMOVE_MODEL, REMOVE_ROWS, REMOVE_ACTIVE,
} from "./inlineConfirmData";
import { ConfirmDialog } from "@/pages/dev/modals/legacy/components/shared/ConfirmDialog";
import { DeleteAnalysisModal } from "@/pages/dev/modals/legacy/pages/run-analysis";
import { DeleteSiteModal, EditSiteModal, EditAreaModal } from "@/pages/dev/modals/legacy/pages/site/overview/SiteDetailDrawer";
import { EscalateModal } from "@/pages/dev/modals/legacy/pages/detection-feed/EscalateModal";
import { LinkCaseModal } from "@/pages/dev/modals/legacy/pages/detection-feed/LinkCaseModal";
import { ConfirmModal } from "@/pages/dev/modals/legacy/pages/site/cameras";
import { UnlinkConfirmModal, DeleteNvrModal, CleanupRunningModal, AddNvrModal, EditNvrModal, ExportRecordingsModal, CleanupStorageModal, CleanupCompletedModal, LinkCameraModal } from "@/pages/dev/modals/legacy/pages/site/nvr";
import { CameraFormModal, LinkNvrModal } from "@/pages/dev/modals/legacy/pages/site/cameras";
import { cameraForm } from "./manage";
import { SyncProgressModal } from "@/pages/dev/modals/legacy/components/shared/SyncProgressModal";
import { DeleteModelModal } from "@/pages/dev/modals/legacy/pages/model-management";
import { DeleteModal as DeleteRuleModal } from "@/pages/dev/modals/legacy/pages/rules-library";
import { DeleteCaseModal } from "@/pages/dev/modals/legacy/pages/incident-cases/CaseDrawer";
import { DeleteRecordingsModal, ExportRecordingModal } from "@/pages/dev/modals/legacy/pages/recordings";
import { type ExportableRecording } from "@/pages/video-enhancement/ExportEnhancedModal";
import { ExportEnhancedModal } from "@/pages/dev/modals/legacy/pages/video-enhancement/ExportEnhancedModal";
import { RestoreDismissedModal } from "@/pages/dev/modals/legacy/pages/detection-feed/dismissed/RestoreDismissedModal";
import { ReinstateModal, DeleteUserModal, ResetConfirmModal } from "@/pages/dev/modals/legacy/pages/user-management";
import { DeleteAccountModal } from "@/pages/dev/modals/legacy/pages/settings";
import { MOCK_PAST_ANALYSES } from "@/mocks/runAnalysis";
import { MOCK_SITES_FULL } from "@/mocks/sites";
import { MOCK_CAMERAS } from "@/mocks/cameras";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_CASES } from "@/mocks/incidentCases";
import { ALL_RECORDINGS, motionClipsFor } from "@/mocks/dayRecordings";
import { MOCK_DISMISSED, MOCK_EVENTS } from "@/mocks/detectionFeed";
import { DismissModal } from "@/pages/dev/modals/legacy/pages/detection-feed/DismissModal";
import { MOCK_USERS } from "@/mocks/users";

/**
 * The confirm, progress and form modals as they were before the redesign
 * (frozen copies from legacy/, or live where the page is unchanged), keyed by
 * gallery entry id. The gallery's entries show the redesigned copies; these are
 * the "old" side of the gallery's compare view. Same mock data as the entries.
 */

const analysis = MOCK_PAST_ANALYSES[0];
const site = MOCK_SITES_FULL[0];
const camera = MOCK_CAMERAS[0];
const nvr = MOCK_NVRS[0];
const incidentCase = MOCK_CASES[0];
const recording = ALL_RECORDINGS.find((r) => r.standby) ?? ALL_RECORDINGS[0];
const user = MOCK_USERS[1];
/* Same camera-day files and Export Enhanced list as the gallery entries. */
const recordingFiles = recording.standby
  ? [recording, recording.standby, ...(recording.standby.motion ? motionClipsFor(recording.standby.motion) : [])]
  : [recording];
const plainRecording = ALL_RECORDINGS.find((r) => r.id !== recording.id) ?? recording;
const enhancedExports: ExportableRecording[] = [
  { rec: recording, files: recordingFiles, applied: ["Brightness +20", "Denoise"] },
  { rec: plainRecording, files: [plainRecording], applied: [] },
];

export const LEGACY_CONFIRMS: Record<string, (close: () => void) => React.ReactNode> = {
  "run-delete-analysis": (close) => (
    <DeleteAnalysisModal target={{ id: analysis.id, name: analysis.name }} onCancel={close} onConfirm={close} />
  ),
  "delete-site": (close) => <DeleteSiteModal site={site} open onClose={close} onConfirm={close} />,
  "camera-confirm-undeploy": (close) => (
    <ConfirmModal
      open
      title="Undeploy Model"
      description="Detection stops on this camera until the model is redeployed."
      confirmLabel="Undeploy"
      onClose={close}
      onConfirm={close}
      detail={
        <>
          <strong className="text-foreground">PPE Compliance v3</strong> will stop running on{" "}
          <strong className="text-foreground">{camera.name}</strong>. No new detection events will be produced until
          the model is redeployed.
        </>
      }
    />
  ),
  "nvr-delete": (close) => <DeleteNvrModal open nvr={nvr} onClose={close} onConfirm={close} />,
  "nvr-unlink": (close) => (
    <UnlinkConfirmModal open nvr={nvr} channel={3} onClose={close} onConfirm={close} onExportFirst={close} />
  ),
  "model-delete": (close) => <DeleteModelModal name="PPE Compliance v3" onConfirm={close} onCancel={close} />,
  "rule-delete": (close) => <DeleteRuleModal ruleName="No helmet in Loading Bay" onConfirm={close} onCancel={close} />,
  "case-delete": (close) => (
    <DeleteCaseModal open caseId={incidentCase.id} caseTitle={incidentCase.title} onClose={close} onConfirm={close} />
  ),
  "delete-recording-single": (close) => (
    <DeleteRecordingsModal open recs={[recording]} onClose={close} onConfirm={close} />
  ),
  "delete-recording-bulk": (close) => (
    <DeleteRecordingsModal open recs={ALL_RECORDINGS.slice(0, 12)} onClose={close} onConfirm={close} />
  ),
  "restore-dismissed": (close) => (
    <RestoreDismissedModal open items={MOCK_DISMISSED.slice(0, 6)} onClose={close} onConfirm={close} />
  ),
  "confirm-dialog": (close) => (
    <ConfirmDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Restore 3 events?"
      description="They move back into the live detection feed and stay counted against this site's usage."
      confirmLabel="Restore"
      onConfirm={close}
    />
  ),
  "confirm-dialog-destructive": (close) => (
    <ConfirmDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Delete 2 recordings?"
      description="This permanently removes the footage from the NVR. It cannot be undone."
      icon={Trash2}
      destructive
      confirmLabel="Delete"
      onConfirm={close}
    >
      <ul className="space-y-1 rounded-md border border-border bg-muted/40 px-3 py-2">
        <li className="flex items-center gap-2 text-sm text-foreground">
          <TriangleAlert className="size-3.5 text-warning" />
          Cam-01 · 23 Mar 2026 · 06h 30m
        </li>
        <li className="flex items-center gap-2 text-sm text-foreground">
          <TriangleAlert className="size-3.5 text-warning" />
          Cam-04 · 23 Mar 2026 · 02h 05m
        </li>
      </ul>
    </ConfirmDialog>
  ),
  "user-reinstate": (close) => <ReinstateModal open users={[user]} onClose={close} onConfirm={close} />,
  "user-delete": (close) => <DeleteUserModal open users={[user]} onClose={close} onConfirm={() => close()} />,
  "user-reset-confirm": (close) => (
    <ResetConfirmModal
      open
      title="Reset 2FA"
      description="The user re-enrols a new authenticator on their next sign-in."
      confirmLabel="Reset 2FA"
      onClose={close}
      onConfirm={close}
      detail={
        <>
          <strong className="text-foreground">{user.fullName}</strong>&apos;s current authenticator stops working
          immediately. They&apos;ll be walked through enrolment the next time they sign in.
        </>
      }
    />
  ),
  "settings-delete-account": (close) => <DeleteAccountModal onClose={close} orgName="Astra Security" />,
  "nvr-cleanup-running": (close) => (
    <CleanupRunningModal open methodLabel="Older than 30 days" totalToProcess={412} onCancel={close} />
  ),
  "export-recording": (close) => (
    <ExportRecordingModal open target={{ rec: recording, items: recordingFiles }} onClose={close} onConfirm={close} />
  ),
  "export-enhanced": (close) => (
    <ExportEnhancedModal
      open
      onOpenChange={(v) => !v && close()}
      items={enhancedExports}
      currentId={recording.id}
      onExport={close}
    />
  ),
  "dismiss-event": (close) => <DismissModal event={MOCK_EVENTS[0]} open onClose={close} onConfirm={close} />,
  "dismiss-event-bulk": (close) => (
    <DismissModal event={null} bulkCount={8} open onClose={close} onConfirm={close} />
  ),
  "escalate-event": (close) => <EscalateModal event={MOCK_EVENTS[0]} open onClose={close} onConfirm={close} />,
  "escalate-event-bulk": (close) => (
    <EscalateModal event={null} bulkCount={5} open onClose={close} onConfirm={close} />
  ),
  "link-case": (close) => (
    <LinkCaseModal
      eventIds={[MOCK_EVENTS[0].id]}
      eventSite={MOCK_EVENTS[0].site}
      eventSiteDisplay={MOCK_EVENTS[0].siteDisplay}
      open
      onClose={close}
      onConfirm={close}
    />
  ),
  "edit-site": (close) => <EditSiteModal site={site} open onClose={close} onSave={() => close()} />,
  "edit-area": (close) => <EditAreaModal area={site.areas[0]} open onClose={close} onSave={() => close()} />,
  "camera-add": (close) => (
    <CameraFormModal open mode="add" initial={null} takenIds={MOCK_CAMERAS.map((c) => c.id)} onClose={close} onSubmit={() => close()} />
  ),
  "camera-edit": (close) => (
    <CameraFormModal open mode="edit" initial={cameraForm} takenIds={MOCK_CAMERAS.map((c) => c.id)} onClose={close} onSubmit={() => close()} />
  ),
  "camera-link-nvr": (close) => <LinkNvrModal open camera={camera} onClose={close} onLink={() => close()} />,
  "nvr-add": (close) => (
    <AddNvrModal open takenIds={MOCK_NVRS.map((n) => n.id)} onClose={close} onConfirm={() => close()} />
  ),
  "nvr-edit": (close) => <EditNvrModal open nvr={nvr} onClose={close} onConfirm={() => close()} />,
  "nvr-export": (close) => <ExportRecordingsModal open nvr={nvr} onClose={close} onConfirm={() => close()} />,
  "nvr-cleanup": (close) => <CleanupStorageModal open nvr={nvr} onClose={close} onConfirm={() => close()} />,
  "nvr-cleanup-done": (close) => (
    <CleanupCompletedModal
      open
      previous={7.4}
      freed={2.1}
      current={5.3}
      total={8}
      processed={{ processed: 412, outOf: 412 }}
      onClose={close}
    />
  ),
  "nvr-link-camera": (close) => <LinkCameraModal open nvr={nvr} channel={3} onClose={close} onConfirm={() => close()} />,
  "sync-progress": (close) => (
    <SyncProgressModal
      title="Syncing with NVR…"
      deviceLabel="Loading Bay Cam"
      stages={["Connecting", "Reading channel map", "Matching cameras", "Writing config"]}
      onCancel={close}
    />
  ),
  /* Inline ConfirmDialogs, reproduced with each page's props and content. */
  "user-menu-sign-out": (close) => (
    <ConfirmDialog
      open
      onOpenChange={(v) => !v && close()}
      destructive
      title="Sign out?"
      description="You'll be signed out on this device and returned to the sign-in screen."
      confirmLabel="Sign Out"
      cancelLabel="Stay signed in"
      onConfirm={close}
    />
  ),
  "deploy-remove-model": (close) => (
    <ConfirmDialog
      open
      onOpenChange={(v) => !v && close()}
      destructive
      title={`Remove ${REMOVE_MODEL} from ${REMOVE_ROWS.length} cameras?`}
      description="This stops inference on the selected cameras and deletes their deployment records. It cannot be undone."
      confirmLabel={`Remove ${REMOVE_ROWS.length} Cameras`}
      cancelLabel="Cancel"
      onConfirm={close}
      size="lg"
    >
      <div className="space-y-3">
        <div className="rounded-[var(--radius)] border border-border bg-muted/30">
          <p className="border-b border-border px-3 py-2 font-mono text-2xs uppercase tracking-widest text-muted-foreground/60">
            Affected cameras ({REMOVE_ROWS.length})
          </p>
          <ul className="max-h-44 space-y-1.5 overflow-auto p-3">
            {REMOVE_ROWS.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-foreground">{d.cameraName}</span>
                <span className="flex-shrink-0 font-mono text-2xs text-muted-foreground">{d.cameraId}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-start gap-2 rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 p-3">
          <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-destructive" />
          <div className="space-y-1 text-sm text-foreground">
            {REMOVE_ACTIVE > 0 && (
              <p>
                <strong>{REMOVE_ACTIVE}</strong> of these deployment{REMOVE_ACTIVE === 1 ? " is" : "s are"} still{" "}
                <strong>active</strong> — detection stops immediately.
              </p>
            )}
            <p className="text-muted-foreground">Cameras stay online. Redeploy from the Deploy tab to restore coverage.</p>
          </div>
        </div>
      </div>
    </ConfirmDialog>
  ),
  "floor-plan-remove": (close) => (
    <ConfirmDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Remove floor plan?"
      description="The image will be removed from this site. Areas and camera positions stay saved, but you'll need to re-upload a plan to see them on the map again."
      confirmLabel="Remove"
      destructive
      onConfirm={close}
    />
  ),
  "billing-cancel-subscription": (close) => (
    <ConfirmDialog
      open
      onOpenChange={(v) => !v && close()}
      destructive
      title="Cancel subscription?"
      description={`Your ${PLAN} plan stays active until ${RENEWS}. After that, access to all ${SITE_COUNT} sites will be suspended.`}
      confirmLabel="Cancel subscription"
      cancelLabel="Keep plan"
      onConfirm={close}
      size="lg"
    >
      <div className="rounded-lg border border-sev-critical/30 bg-sev-critical/[0.05] p-3 text-sm">
        <p className="mb-2 font-semibold text-foreground">What happens when it ends</p>
        <ul className="space-y-1.5 text-muted-foreground">
          {[
            "Live detection and recording stop across all sites",
            "Team members lose access to dashboards",
            "Recordings are retained for 30 days, then deleted",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <X className="mt-0.5 size-3.5 flex-shrink-0 text-sev-critical" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </ConfirmDialog>
  ),
  "billing-resume-subscription": (close) => (
    <ConfirmDialog
      open
      onOpenChange={(v) => !v && close()}
      icon={RotateCcw}
      title="Resume subscription?"
      description={`Your ${PLAN} plan will stay active and renew on ${RENEWS} at ${MONTHLY_TOTAL}.`}
      confirmLabel="Resume subscription"
      cancelLabel="Not now"
      onConfirm={close}
      size="lg"
    >
      <div className="rounded-lg border border-success/30 bg-success/[0.05] p-3 text-sm">
        <p className="mb-2 font-semibold text-foreground">What stays the same</p>
        <ul className="space-y-1.5 text-muted-foreground">
          {[
            `Live detection and recording continue across all ${SITE_COUNT} sites`,
            "Team members keep access to dashboards",
            "Seats, cameras and payment method stay unchanged",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 flex-shrink-0 text-success" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </ConfirmDialog>
  ),
  "billing-end-subscription": (close) => (
    <ConfirmDialog
      open
      onOpenChange={(v) => !v && close()}
      destructive
      title="End subscription now?"
      description={`This ends your ${PLAN} plan immediately instead of on ${RENEWS}. You won't be refunded for the remaining period.`}
      confirmLabel="End now"
      cancelLabel="Keep until renewal"
      onConfirm={close}
      size="lg"
    >
      <div className="rounded-lg border border-sev-critical/30 bg-sev-critical/[0.05] p-3 text-sm">
        <p className="mb-2 font-semibold text-foreground">What happens immediately</p>
        <ul className="space-y-1.5 text-muted-foreground">
          {[
            `Live detection and recording stop across all ${SITE_COUNT} sites`,
            "Team members lose access to dashboards",
            "Recordings are retained for 30 days, then deleted",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <X className="mt-0.5 size-3.5 flex-shrink-0 text-sev-critical" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </ConfirmDialog>
  ),
};
