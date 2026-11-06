import { RecordingDrawer } from "@/pages/recordings";
import { EventDrawer } from "@/pages/detection-feed/EventDrawer";
import { DismissedDrawer } from "@/pages/detection-feed/dismissed/DismissedDrawer";
import { ALL_RECORDINGS, motionClipsFor } from "@/mocks/dayRecordings";
import { MOCK_EVENTS, MOCK_DISMISSED } from "@/mocks/detectionFeed";
import { RecordingPlayerModal } from "@/pages/recordings/RecordingPlayerModal";
import type { ExportableRecording } from "@/pages/video-enhancement/ExportEnhancedModal";
import { ExportRecordingCopy, ExportEnhancedCopy } from "../exportCopies";
import { DeleteRecordingsCopy, RestoreDismissedCopy } from "../confirmCopies";
import { DismissCopy } from "../dismissCopy";
import { EscalateCopy, LinkCaseCopy } from "../formCopies";
import type { ModalEntry } from "../types";
import { RecordingPlayerModal as LegacyRecordingPlayerModal } from "@/pages/dev/modals/legacy/pages/recordings/RecordingPlayerModal";

/* An operation camera-day shows the most: its standby and motion clips. */
const recording = ALL_RECORDINGS.find((r) => r.standby) ?? ALL_RECORDINGS[0];
const recordingFiles = recording.standby
  ? [recording, recording.standby, ...(recording.standby.motion ? motionClipsFor(recording.standby.motion) : [])]
  : [recording];
/* Export Enhanced lists every recording opened on the page; the second has nothing applied. */
const plainRecording = ALL_RECORDINGS.find((r) => r.id !== recording.id) ?? recording;
const enhancedExports: ExportableRecording[] = [
  { rec: recording, files: recordingFiles, applied: ["Brightness +20", "Denoise"] },
  { rec: plainRecording, files: [plainRecording], applied: [] },
];
const event = MOCK_EVENTS[0];
const dismissed = MOCK_DISMISSED[0];

export const MONITOR_ENTRIES: ModalEntry[] = [
  /* ── Recordings ───────────────────────────────────────────────────────── */
  {
    id: "recording-drawer",
    name: "RecordingDrawer",
    module: "Monitor · Recordings",
    file: "src/pages/recordings/index.tsx",
    kind: "drawer",
    trigger: "Recordings → click a recording row.",
    note: "Operation camera-day: the recording, then its standby and motion clips.",
    render: (close) => (
      <RecordingDrawer
        rec={recording}
        open
        bookmarked={false}
        onClose={close}
        onDelete={close}
        onExport={() => undefined}
        onToggleBookmark={() => undefined}
        onPlay={() => undefined}
      />
    ),
  },
  {
    id: "export-recording",
    name: "ExportRecordingModal",
    module: "Monitor · Recordings",
    file: "src/pages/recordings/index.tsx",
    kind: "modal",
    trigger: "Recordings → open a recording → Export.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => <ExportRecordingCopy rec={recording} items={recordingFiles} onClose={close} />,
  },
  {
    id: "delete-recording-single",
    name: "DeleteRecordingsModal",
    module: "Monitor · Recordings",
    file: "src/pages/recordings/index.tsx",
    kind: "confirm",
    trigger: "Recordings → row menu → Delete.",
    note: "Gallery copy with the unified confirm look — the page still uses its own version. Single-recording copy.",
    render: (close) => <DeleteRecordingsCopy recs={[recording]} onClose={close} />,
  },
  {
    id: "delete-recording-bulk",
    name: "DeleteRecordingsModal",
    module: "Monitor · Recordings",
    file: "src/pages/recordings/index.tsx",
    kind: "confirm",
    trigger: "Recordings → select rows → Delete selected.",
    note: "Gallery copy with the unified confirm look — the page still uses its own version. Bulk copy (12 selected).",
    render: (close) => <DeleteRecordingsCopy recs={ALL_RECORDINGS.slice(0, 12)} onClose={close} />,
  },

  {
    id: "recording-player",
    name: "RecordingPlayerModal",
    module: "Monitor · Recordings",
    file: "src/pages/recordings/RecordingPlayerModal.tsx",
    kind: "modal",
    trigger: "Recordings → row → Play.",
    note: "Restyled in place (plain header) — the page still uses its own version. Media player, xl size.",
    render: (close) => <RecordingPlayerModal recording={recording} open onClose={close} />,
    legacyRender: (close) => <LegacyRecordingPlayerModal recording={recording} open onClose={close} />,
  },

  /* ── Video Enhancement ────────────────────────────────────────────────── */
  {
    id: "export-enhanced",
    name: "ExportEnhancedModal",
    module: "Monitor · Video Enhancement",
    file: "src/pages/video-enhancement/ExportEnhancedModal.tsx",
    kind: "modal",
    trigger: "Video Enhancement → Export.",
    note: "Redesigned copy — the page still uses its own version. One row has no enhancements, so it can't be picked.",
    render: (close) => <ExportEnhancedCopy items={enhancedExports} currentId={recording.id} onClose={close} />,
  },

  /* ── Detection Feed ───────────────────────────────────────────────────── */
  {
    id: "event-drawer",
    name: "EventDrawer",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/EventDrawer.tsx",
    kind: "drawer",
    trigger: "Detection Feed → click an event.",
    note: "Entity chips inside open a nested EntityDrawer.",
    render: (close) => (
      <EventDrawer event={event} open onClose={close} onEscalate={() => undefined} onDismiss={() => undefined} />
    ),
  },
  {
    id: "dismiss-event",
    name: "DismissModal",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/DismissModal.tsx",
    kind: "modal",
    trigger: "Detection Feed → event → Dismiss.",
    note: "Redesigned copy — the page still uses its own version. Single event.",
    render: (close) => <DismissCopy event={event} onClose={close} />,
  },
  {
    id: "dismiss-event-bulk",
    name: "DismissModal",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/DismissModal.tsx",
    kind: "modal",
    trigger: "Detection Feed → select events → Dismiss.",
    note: "Redesigned copy — the page still uses its own version. Bulk copy (8 events).",
    render: (close) => <DismissCopy event={null} bulkCount={8} onClose={close} />,
  },
  {
    id: "escalate-event",
    name: "EscalateModal",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/EscalateModal.tsx",
    kind: "modal",
    trigger: "Detection Feed → event → Escalate to case.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => <EscalateCopy event={event} onClose={close} />,
  },
  {
    id: "escalate-event-bulk",
    name: "EscalateModal",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/EscalateModal.tsx",
    kind: "modal",
    trigger: "Detection Feed → select events → Escalate.",
    note: "Redesigned copy — the page still uses its own version. Bulk copy (5 events).",
    render: (close) => <EscalateCopy event={null} bulkCount={5} onClose={close} />,
  },
  {
    id: "link-case",
    name: "LinkCaseModal",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/LinkCaseModal.tsx",
    kind: "modal",
    trigger: "Detection Feed → event → Link to existing case.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => (
      <LinkCaseCopy eventIds={[event.id]} eventSite={event.site} eventSiteDisplay={event.siteDisplay} onClose={close} />
    ),
  },
  {
    id: "dismissed-drawer",
    name: "DismissedDrawer",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/dismissed/DismissedDrawer.tsx",
    kind: "drawer",
    trigger: "Detection Feed → Dismissed → click a row.",
    render: (close) => (
      <DismissedDrawer item={dismissed} open onClose={close} onRestore={() => close()} />
    ),
  },
  {
    id: "restore-dismissed",
    name: "RestoreDismissedModal",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/dismissed/RestoreDismissedModal.tsx",
    kind: "confirm",
    trigger: "Detection Feed → Dismissed → select rows → Restore.",
    note: "Gallery copy with the unified confirm look — the page still uses its own version. Bulk copy (6 events).",
    render: (close) => <RestoreDismissedCopy items={MOCK_DISMISSED.slice(0, 6)} onClose={close} />,
  },
];
