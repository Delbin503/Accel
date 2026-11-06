import { SetupCompleteModal } from "@/components/shared/SetupCompleteModal";
import { NotificationsDrawer } from "@/components/shared/NotificationsDrawer";
import { GuideGifModal } from "@/components/custom/guide-gif-modal";
import {
  renderDrawAreaFrame, DRAW_AREA_FRAME_COUNT,
  renderPlaceCameraFrame, PLACE_CAMERA_FRAME_COUNT,
} from "@/pages/site/overview/FloorPlanGuide";
import { ConfirmDialogCopy, ConfirmDialogDestructiveCopy } from "../confirmCopies";
import { ALL_RECORDINGS } from "@/mocks/dayRecordings";
import { SyncProgressCopy } from "../progressCopies";
import { SignOutCopy } from "../confirmCopies";
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
    note: "Gallery copy with the unified confirm look — the page still uses its own version. Neutral variant, compact size.",
    render: (close) => <ConfirmDialogCopy onClose={close} />,
  },
  {
    id: "confirm-dialog-destructive",
    name: "ConfirmDialog",
    module: "Shared · Primitives",
    file: "src/components/shared/ConfirmDialog.tsx",
    kind: "confirm",
    trigger: "Same primitive, destructive tone.",
    note: "Gallery copy with the unified confirm look — the page still uses its own version. Destructive + icon + children slot (affected-items list).",
    render: (close) => <ConfirmDialogDestructiveCopy recs={ALL_RECORDINGS.slice(0, 2)} onClose={close} />,
  },
  {
    id: "draw-zone",
    name: "DrawZoneModal",
    module: "Shared · Primitives",
    file: "src/components/shared/DrawZoneModal.tsx",
    kind: "modal",
    trigger: "Cameras → camera → Detection Zones; Site → Zones.",
    note: "Restyled in place (plain header) — the page still uses its own version. Single-camera mode. Drag on the frame to draw a box.",
    render: (close) => <DrawZonePreview onClose={close} />,
  },
  {
    id: "draw-zone-wizard",
    name: "DrawZoneModal",
    module: "Shared · Primitives",
    file: "src/components/shared/DrawZoneModal.tsx",
    kind: "modal",
    trigger: "Model Deployment wizard → zone step.",
    note: "Restyled in place (plain header) — the page still uses its own version. Wizard mode: camera picker, Apply-to-all, Next / Skip footer.",
    render: (close) => <DrawZonePreview onClose={close} withPicker />,
  },
  {
    id: "sync-progress",
    name: "SyncProgressModal",
    module: "Shared · Primitives",
    file: "src/components/shared/SyncProgressModal.tsx",
    kind: "progress",
    trigger: "Cameras → NVR sync; NVR → Manual sync.",
    note: "Redesigned copy — the page still uses its own version. Self-advancing; watch it step through the stages.",
    render: (close) => (
      <SyncProgressCopy
        title="Syncing with NVR…"
        deviceLabel="Loading Bay Cam"
        stages={["Connecting", "Reading channel map", "Matching cameras", "Writing config"]}
        onClose={close}
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
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version.",
    render: (close) => <SetupCompleteModal open onEnter={close} workspaceName="Astra Security" />,
  },
  {
    id: "guide-draw-area",
    name: "GuideGifModal",
    module: "Shared · Primitives",
    file: "src/components/custom/guide-gif-modal.tsx",
    kind: "modal",
    trigger: "Floor-plan editor → \"How do I draw an area?\".",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version. Looping SVG demo — drawing an area.",
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
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version. Looping SVG demo — placing and aiming a camera.",
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
  {
    id: "user-menu-sign-out",
    name: "ConfirmDialog (Sign out)",
    module: "Shared · Primitives",
    file: "src/components/shared/UserMenu.tsx",
    kind: "confirm",
    trigger: "Avatar menu → Sign Out.",
    note: "Redesigned copy — the page still uses its own version. Built inline with ConfirmDialog.",
    render: (close) => <SignOutCopy onClose={close} />,
  },
];
