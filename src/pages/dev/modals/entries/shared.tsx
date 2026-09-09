import { Trash2, TriangleAlert } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SetupCompleteModal } from "@/components/shared/SetupCompleteModal";
import { SyncProgressModal } from "@/components/shared/SyncProgressModal";
import { NotificationsDrawer } from "@/components/shared/NotificationsDrawer";
import { GuideGifModal } from "@/components/custom/guide-gif-modal";
import {
  renderDrawAreaFrame, DRAW_AREA_FRAME_COUNT,
  renderPlaceCameraFrame, PLACE_CAMERA_FRAME_COUNT,
} from "@/pages/site/overview/FloorPlanGuide";
import type { ModalEntry } from "../types";
import { DrawZonePreview } from "../previews";

/* ── Entries ────────────────────────────────────────────────────────────── */

export const SHARED_ENTRIES: ModalEntry[] = [
  {
    id: "confirm-dialog",
    name: "ConfirmDialog",
    module: "Shared · Primitives",
    file: "src/components/shared/ConfirmDialog.tsx",
    kind: "confirm",
    trigger: "Every yes/no confirmation in the app builds on this.",
    note: "Neutral variant, compact size.",
    render: (close) => (
      <ConfirmDialog
        open
        onOpenChange={(v) => !v && close()}
        title="Restore 3 events?"
        description="They move back into the live detection feed and stay counted against this site's usage."
        confirmLabel="Restore"
        onConfirm={close}
      />
    ),
  },
  {
    id: "confirm-dialog-destructive",
    name: "ConfirmDialog",
    module: "Shared · Primitives",
    file: "src/components/shared/ConfirmDialog.tsx",
    kind: "confirm",
    trigger: "Same primitive, destructive tone.",
    note: "Destructive + icon + children slot (affected-items list).",
    render: (close) => (
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
  },
  {
    id: "draw-zone",
    name: "DrawZoneModal",
    module: "Shared · Primitives",
    file: "src/components/shared/DrawZoneModal.tsx",
    kind: "modal",
    trigger: "Cameras → camera → Detection Zones; Site → Zones.",
    note: "Single-camera mode. Drag on the frame to draw a box.",
    render: (close) => <DrawZonePreview onClose={close} />,
  },
  {
    id: "draw-zone-wizard",
    name: "DrawZoneModal",
    module: "Shared · Primitives",
    file: "src/components/shared/DrawZoneModal.tsx",
    kind: "modal",
    trigger: "Model Deployment wizard → zone step.",
    note: "Wizard mode: camera picker, Apply-to-all, Next / Skip footer.",
    render: (close) => <DrawZonePreview onClose={close} withPicker />,
  },
  {
    id: "sync-progress",
    name: "SyncProgressModal",
    module: "Shared · Primitives",
    file: "src/components/shared/SyncProgressModal.tsx",
    kind: "progress",
    trigger: "Cameras → NVR sync; NVR → Manual sync.",
    note: "Self-advancing progress ring — watch it step through the stages.",
    render: (close) => (
      <SyncProgressModal
        title="Syncing with NVR…"
        deviceLabel="Loading Bay Cam"
        stages={["Connecting", "Reading channel map", "Matching cameras", "Writing config"]}
        onCancel={close}
      />
    ),
  },
  {
    id: "setup-complete",
    name: "SetupCompleteModal",
    module: "Shared · Primitives",
    file: "src/components/shared/SetupCompleteModal.tsx",
    kind: "modal",
    trigger: "Final step of cloud sign-up and on-prem setup.",
    render: (close) => <SetupCompleteModal open onEnter={close} workspaceName="Astra Security" />,
  },
  {
    id: "guide-draw-area",
    name: "GuideGifModal",
    module: "Shared · Primitives",
    file: "src/components/custom/guide-gif-modal.tsx",
    kind: "modal",
    trigger: "Floor-plan editor → \"How do I draw an area?\".",
    note: "Looping SVG demo — drawing an area.",
    render: (close) => (
      <GuideGifModal
        open
        onClose={close}
        title="Drawing an area"
        description="Click around the map to drop a point per corner, then hit Finish to close the shape. Double-click also closes it."
        frameCount={DRAW_AREA_FRAME_COUNT}
        renderFrame={renderDrawAreaFrame}
        ctaLabel="Got it, let's draw"
      />
    ),
  },
  {
    id: "guide-place-camera",
    name: "GuideGifModal",
    module: "Shared · Primitives",
    file: "src/components/custom/guide-gif-modal.tsx",
    kind: "modal",
    trigger: "Floor-plan editor → \"How do I place a camera?\".",
    note: "Looping SVG demo — placing and aiming a camera.",
    render: (close) => (
      <GuideGifModal
        open
        onClose={close}
        title="Placing a camera"
        description="Drag the camera icon to where it sits on-site, then drag its orange handle to set which way it's facing."
        frameCount={PLACE_CAMERA_FRAME_COUNT}
        renderFrame={renderPlaceCameraFrame}
        ctaLabel="Got it, let's place it"
      />
    ),
  },
  {
    id: "notifications-drawer",
    name: "NotificationsDrawer",
    module: "Shared · Primitives",
    file: "src/components/shared/NotificationsDrawer.tsx",
    kind: "drawer",
    trigger: "Bell icon in the top bar.",
    render: (close) => <NotificationsDrawer open onClose={close} />,
  },
];
