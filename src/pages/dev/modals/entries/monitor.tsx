import { RecordingDrawer, DeleteRecordingsModal } from "@/pages/recordings";
import { EventDrawer } from "@/pages/detection-feed/EventDrawer";
import { DismissModal } from "@/pages/detection-feed/DismissModal";
import { EscalateModal } from "@/pages/detection-feed/EscalateModal";
import { LinkCaseModal } from "@/pages/detection-feed/LinkCaseModal";
import { DismissedDrawer } from "@/pages/detection-feed/dismissed/DismissedDrawer";
import { MOCK_RECORDINGS } from "@/mocks/recordings";
import { MOCK_EVENTS, MOCK_DISMISSED } from "@/mocks/detectionFeed";
import type { ModalEntry } from "../types";

const recording = MOCK_RECORDINGS[0];
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
    trigger: "Recordings → click a recording card or row.",
    render: (close) => (
      <RecordingDrawer recording={recording} open onClose={close} onDeleteRecording={() => close()} />
    ),
  },
  {
    id: "delete-recording-single",
    name: "DeleteRecordingsModal",
    module: "Monitor · Recordings",
    file: "src/pages/recordings/index.tsx",
    kind: "confirm",
    trigger: "Recordings → row menu → Delete.",
    note: "Single-recording copy.",
    render: (close) => (
      <DeleteRecordingsModal
        open
        count={1}
        single={{ id: recording.id, detail: `${recording.cameraName} · ${recording.dateLabel} · ${recording.durationDisplay}` }}
        onClose={close}
        onConfirm={close}
      />
    ),
  },
  {
    id: "delete-recording-bulk",
    name: "DeleteRecordingsModal",
    module: "Monitor · Recordings",
    file: "src/pages/recordings/index.tsx",
    kind: "confirm",
    trigger: "Recordings → select rows → Delete selected.",
    note: "Bulk copy (12 selected).",
    render: (close) => (
      <DeleteRecordingsModal open count={12} single={null} onClose={close} onConfirm={close} />
    ),
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
    note: "Single event.",
    render: (close) => <DismissModal event={event} open onClose={close} onConfirm={close} />,
  },
  {
    id: "dismiss-event-bulk",
    name: "DismissModal",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/DismissModal.tsx",
    kind: "modal",
    trigger: "Detection Feed → select events → Dismiss.",
    note: "Bulk copy (8 events).",
    render: (close) => <DismissModal event={null} bulkCount={8} open onClose={close} onConfirm={close} />,
  },
  {
    id: "escalate-event",
    name: "EscalateModal",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/EscalateModal.tsx",
    kind: "modal",
    trigger: "Detection Feed → event → Escalate to case.",
    render: (close) => <EscalateModal event={event} open onClose={close} onConfirm={close} />,
  },
  {
    id: "escalate-event-bulk",
    name: "EscalateModal",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/EscalateModal.tsx",
    kind: "modal",
    trigger: "Detection Feed → select events → Escalate.",
    note: "Bulk copy (5 events).",
    render: (close) => <EscalateModal event={null} bulkCount={5} open onClose={close} onConfirm={close} />,
  },
  {
    id: "link-case",
    name: "LinkCaseModal",
    module: "Monitor · Detection Feed",
    file: "src/pages/detection-feed/LinkCaseModal.tsx",
    kind: "modal",
    trigger: "Detection Feed → event → Link to existing case.",
    render: (close) => (
      <LinkCaseModal
        eventIds={[event.id]}
        eventSite={event.site}
        eventSiteDisplay={event.siteDisplay}
        open
        onClose={close}
        onConfirm={close}
      />
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
];
