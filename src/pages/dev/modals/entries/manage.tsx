import { CreateSiteWizard } from "@/pages/site/overview/CreateSiteWizard";
import { SiteDetailDrawer } from "@/pages/site/overview/SiteDetailDrawer";
import { CameraDrawer, type CameraFormFields } from "@/pages/site/cameras";
import { NvrDrawer } from "@/pages/site/nvr";
import {
  CameraFormCopy, LinkNvrChannelCopy, AddNvrCopy, EditNvrCopy,
  ExportRecordingsCopy, CleanupStorageCopy, CleanupCompletedCopy, LinkCameraCopy,
} from "../deviceCopies";
import { CreateModelModal, AddStepModal, ExtractRulesPrompt, AddRuleModal } from "@/pages/model-management";
import { CaseDrawer, ChangeStatusModal, ReassignModal, LinkNewIncidentsModal, EditCaseModal } from "@/pages/incident-cases/CaseDrawer";
import { EntityDrawer } from "@/pages/incident-cases/EntityDrawer";
import { MOCK_SITES_FULL, SITE_ACCENT_COLORS } from "@/mocks/sites";
import { MOCK_CAMERAS } from "@/mocks/cameras";
import { MOCK_DEPLOYMENTS } from "@/mocks/deployments";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_CASES, ASSIGNEES } from "@/mocks/incidentCases";
import { ENTITY_PROFILES } from "@/mocks/entities";
import type { SiteData } from "@/types/sites";
import { ConditionModal } from "@/pages/rules-library/RuleConditions";
import { newCondition } from "@/lib/ruleTemplates";
import { EVENT_TEMPLATES } from "@/mocks/ruleTemplates";
import { MOCK_RULES } from "@/mocks/rulesLibrary";
import { DeleteCaseCopy, DeleteNamedCopy, DeleteNvrCopy, DeleteSiteCopy, UndeployModelCopy, UnlinkCameraCopy } from "../confirmCopies";
import { CleanupProgressCopy } from "../progressCopies";
import { EditSiteCopy, EditAreaCopy } from "../formCopies";
import { RemoveFloorPlanCopy } from "../confirmCopies";
import { FLOOR_PLAN_SITE } from "./inlineConfirmData";
import type { ModalEntry } from "../types";
import { FloorPlanPreview } from "../previews";
import { CreateModelModal as LegacyCreateModelModal, AddStepModal as LegacyAddStepModal, AddRuleModal as LegacyAddRuleModal } from "@/pages/dev/modals/legacy/pages/model-management";
import { ConditionModal as LegacyConditionModal } from "@/pages/dev/modals/legacy/pages/rules-library/RuleConditions";
import { ChangeStatusModal as LegacyChangeStatusModal, ReassignModal as LegacyReassignModal, LinkNewIncidentsModal as LegacyLinkNewIncidentsModal, EditCaseModal as LegacyEditCaseModal } from "@/pages/dev/modals/legacy/pages/incident-cases/CaseDrawer";

const site: SiteData = MOCK_SITES_FULL[0];
const area = site.areas[0];
const camera = MOCK_CAMERAS[0];
const nvr = MOCK_NVRS[0];
const incidentCase = MOCK_CASES[0];
const entity = Object.values(ENTITY_PROFILES)[0];

/** Edit-mode form values for a camera — the page derives these from CameraData. */
export const cameraForm: CameraFormFields = {
  id: camera.id,
  name: camera.name,
  siteId: camera.siteId,
  areaId: camera.areaId,
  ipAddress: camera.ipAddress,
  username: camera.username,
  password: camera.password,
  rtspPort: String(camera.rtspPort),
  rtspUrl: camera.rtspUrl,
  resolution: camera.stream.resolution,
  frameRate: String(camera.stream.frameRate),
  retentionDays: String(camera.recording.retentionDays),
  nvrId: camera.nvrId ?? "",
  channel: camera.channel,
  recordingMode: camera.recording.schedule === "always" ? "continuous" : "scheduled",
  scheduleDays: camera.recording.scheduleDays ?? [1, 2, 3, 4, 5],
  scheduleStart: camera.recording.scheduleStart ?? "00:00",
  scheduleEnd: camera.recording.scheduleEnd ?? "23:59",
};

/* ── Entries ────────────────────────────────────────────────────────────── */

export const MANAGE_ENTRIES: ModalEntry[] = [
  /* ── Site · Overview ──────────────────────────────────────────────────── */
  {
    id: "create-site-wizard",
    name: "CreateSiteWizard",
    module: "Site · Overview",
    file: "src/pages/site/overview/CreateSiteWizard.tsx",
    kind: "wizard",
    trigger: "Site Management → Add Site.",
    note: "4 steps: details → areas → floor plan → review.",
    render: (close) => (
      <CreateSiteWizard open onClose={close} onCreate={() => close()} accentChoices={SITE_ACCENT_COLORS} />
    ),
  },
  {
    id: "site-detail-drawer",
    name: "SiteDetailDrawer",
    module: "Site · Overview",
    file: "src/pages/site/overview/SiteDetailDrawer.tsx",
    kind: "drawer",
    trigger: "Site Management → click a site row.",
    note: "Hosts the floor-plan editor and the site edit/delete modals.",
    render: (close) => <SiteDetailDrawer siteId={site.id} open onClose={close} />,
  },
  {
    id: "edit-site",
    name: "EditSiteModal",
    module: "Site · Overview",
    file: "src/pages/site/overview/SiteDetailDrawer.tsx",
    kind: "modal",
    trigger: "Site drawer → Edit Site.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => <EditSiteCopy site={site} onClose={close} />,
  },
  {
    id: "edit-area",
    name: "EditAreaModal",
    module: "Site · Overview",
    file: "src/pages/site/overview/SiteDetailDrawer.tsx",
    kind: "modal",
    trigger: "Floor-plan editor → area → Rename.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => <EditAreaCopy area={area} onClose={close} />,
  },
  {
    id: "delete-site",
    name: "DeleteSiteModal",
    module: "Site · Overview",
    file: "src/pages/site/overview/SiteDetailDrawer.tsx",
    kind: "confirm",
    trigger: "Site drawer → Delete Site.",
    note: "Gallery copy with the unified confirm look — the page still uses its own version. Type-to-confirm on the site name.",
    render: (close) => <DeleteSiteCopy site={site} onClose={close} />,
  },
  {
    id: "floor-plan-editor",
    name: "FloorPlanModal",
    module: "Site · Overview",
    file: "src/pages/site/overview/SiteDetailDrawer.tsx",
    kind: "modal",
    trigger: "Site drawer → Open Floor Plan Editor.",
    note: "Restyled in place (plain header) — the page still uses its own version. Full-bleed editor. Draw areas, place cameras, aim them.",
    render: (close) => <FloorPlanPreview onClose={close} />,
  },

  /* ── Site · Cameras ───────────────────────────────────────────────────── */
  {
    id: "camera-drawer",
    name: "CameraDrawer",
    module: "Site · Cameras",
    file: "src/pages/site/cameras/index.tsx",
    kind: "drawer",
    trigger: "Cameras → click a camera row.",
    render: (close) => (
      <CameraDrawer
        camera={camera}
        deployments={MOCK_DEPLOYMENTS}
        open
        onClose={close}
        onOpenNvr={() => undefined}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onNvrSync={() => undefined}
        onLinkNvrRequest={() => undefined}
        onUnlinkNvr={() => undefined}
      />
    ),
  },
  {
    id: "camera-drawer-loading",
    name: "CameraDrawer",
    module: "Site · Cameras",
    file: "src/pages/site/cameras/index.tsx",
    kind: "drawer",
    trigger: "Same drawer while the detail fetch is in flight.",
    note: "asyncState=\"loading\" — skeleton state.",
    render: (close) => (
      <CameraDrawer
        camera={camera}
        deployments={MOCK_DEPLOYMENTS}
        open
        asyncState="loading"
        onClose={close}
        onOpenNvr={() => undefined}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onNvrSync={() => undefined}
        onLinkNvrRequest={() => undefined}
        onUnlinkNvr={() => undefined}
      />
    ),
  },
  {
    id: "camera-drawer-error",
    name: "CameraDrawer",
    module: "Site · Cameras",
    file: "src/pages/site/cameras/index.tsx",
    kind: "drawer",
    trigger: "Same drawer when the detail fetch fails.",
    note: "asyncState=\"error\".",
    render: (close) => (
      <CameraDrawer
        camera={camera}
        deployments={MOCK_DEPLOYMENTS}
        open
        asyncState="error"
        onClose={close}
        onOpenNvr={() => undefined}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onNvrSync={() => undefined}
        onLinkNvrRequest={() => undefined}
        onUnlinkNvr={() => undefined}
      />
    ),
  },
  {
    id: "camera-add",
    name: "CameraFormModal",
    module: "Site · Cameras",
    file: "src/pages/site/cameras/index.tsx",
    kind: "modal",
    trigger: "Cameras → Add Camera.",
    note: "Redesigned copy — the page still uses its own version. mode=\"add\" — empty form with a generated camera ID.",
    render: (close) => (
      <CameraFormCopy mode="add" initial={null} takenIds={MOCK_CAMERAS.map((c) => c.id)} onClose={close} />
    ),
  },
  {
    id: "camera-edit",
    name: "CameraFormModal",
    module: "Site · Cameras",
    file: "src/pages/site/cameras/index.tsx",
    kind: "modal",
    trigger: "Cameras → camera → Edit.",
    note: "Redesigned copy — the page still uses its own version. mode=\"edit\" — pre-filled from an existing camera.",
    render: (close) => (
      <CameraFormCopy mode="edit" initial={cameraForm} takenIds={MOCK_CAMERAS.map((c) => c.id)} onClose={close} />
    ),
  },
  {
    id: "camera-link-nvr",
    name: "LinkNvrModal",
    module: "Site · Cameras",
    file: "src/pages/site/cameras/index.tsx",
    kind: "modal",
    trigger: "Camera drawer → Link to NVR.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => <LinkNvrChannelCopy camera={camera} onClose={close} />,
  },
  {
    id: "camera-confirm-undeploy",
    name: "ConfirmModal",
    module: "Site · Cameras",
    file: "src/pages/site/cameras/index.tsx",
    kind: "confirm",
    trigger: "Camera drawer → deployed model → Undeploy.",
    note: "Gallery copy with the unified confirm look — the page still uses its own version. Page-local confirm shell with a consequence callout.",
    render: (close) => <UndeployModelCopy cameraName={camera.name} modelName="PPE Compliance v3" onClose={close} />,
  },

  /* ── Site · NVR ───────────────────────────────────────────────────────── */
  {
    id: "nvr-drawer",
    name: "NvrDrawer",
    module: "Site · NVR",
    file: "src/pages/site/nvr/index.tsx",
    kind: "drawer",
    trigger: "NVR & Devices → click an NVR row.",
    render: (close) => (
      <NvrDrawer
        nvr={nvr}
        open
        onClose={close}
        onOpenCamera={() => undefined}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onCleanup={() => undefined}
        onExportAll={() => undefined}
        onManualSync={() => undefined}
        onLinkCamera={() => undefined}
        onUnlink={() => undefined}
      />
    ),
  },
  {
    id: "nvr-add",
    name: "AddNvrModal",
    module: "Site · NVR",
    file: "src/pages/site/nvr/index.tsx",
    kind: "modal",
    trigger: "NVR & Devices → Add NVR.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => (
      <AddNvrCopy takenIds={MOCK_NVRS.map((n) => n.id)} onClose={close} />
    ),
  },
  {
    id: "nvr-edit",
    name: "EditNvrModal",
    module: "Site · NVR",
    file: "src/pages/site/nvr/index.tsx",
    kind: "modal",
    trigger: "NVR drawer → Edit.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => <EditNvrCopy nvr={nvr} onClose={close} />,
  },
  {
    id: "nvr-delete",
    name: "DeleteNvrModal",
    module: "Site · NVR",
    file: "src/pages/site/nvr/index.tsx",
    kind: "confirm",
    trigger: "NVR drawer → Delete.",
    note: "Gallery copy with the unified confirm look — the page still uses its own version.",
    render: (close) => <DeleteNvrCopy nvr={nvr} onClose={close} />,
  },
  {
    id: "nvr-export",
    name: "ExportRecordingsModal",
    module: "Site · NVR",
    file: "src/pages/site/nvr/index.tsx",
    kind: "modal",
    trigger: "NVR drawer → Export recordings.",
    note: "Redesigned copy — the page still uses its own version. Channel picker + range + format, with a size estimate.",
    render: (close) => (
      <ExportRecordingsCopy nvr={nvr} onClose={close} />
    ),
  },
  {
    id: "nvr-cleanup",
    name: "CleanupStorageModal",
    module: "Site · NVR",
    file: "src/pages/site/nvr/index.tsx",
    kind: "modal",
    trigger: "NVR drawer → Clean up storage.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => (
      <CleanupStorageCopy nvr={nvr} onClose={close} />
    ),
  },
  {
    id: "nvr-cleanup-running",
    name: "CleanupRunningModal",
    module: "Site · NVR",
    file: "src/pages/site/nvr/index.tsx",
    kind: "progress",
    trigger: "Immediately after a cleanup is confirmed.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => <CleanupProgressCopy methodLabel="Older than 30 days" totalToProcess={412} onClose={close} />,
  },
  {
    id: "nvr-cleanup-done",
    name: "CleanupCompletedModal",
    module: "Site · NVR",
    file: "src/pages/site/nvr/index.tsx",
    kind: "modal",
    trigger: "When a cleanup run finishes.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => (
      <CleanupCompletedCopy
        previous={7.4}
        freed={2.1}
        current={5.3}
        total={8}
        processed={{ processed: 412, outOf: 412 }}
        onClose={close}
      />
    ),
  },
  {
    id: "nvr-link-camera",
    name: "LinkCameraModal",
    module: "Site · NVR",
    file: "src/pages/site/nvr/index.tsx",
    kind: "modal",
    trigger: "NVR drawer → channel → Link camera.",
    note: "Redesigned copy — the page still uses its own version.",
    render: (close) => (
      <LinkCameraCopy nvr={nvr} channel={3} onClose={close} />
    ),
  },
  {
    id: "nvr-unlink",
    name: "UnlinkConfirmModal",
    module: "Site · NVR",
    file: "src/pages/site/nvr/index.tsx",
    kind: "confirm",
    trigger: "NVR drawer → channel → Unlink.",
    note: "Gallery copy with the unified confirm look — the page still uses its own version. Offers an export-first escape hatch.",
    render: (close) => <UnlinkCameraCopy nvr={nvr} channel={3} onClose={close} />,
  },

  /* ── Model Management ─────────────────────────────────────────────────── */
  {
    id: "model-create",
    name: "CreateModelModal",
    module: "Manage · Model Management",
    file: "src/pages/model-management/index.tsx",
    kind: "modal",
    trigger: "Model Management → New Model.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version.",
    render: (close) => <CreateModelModal onConfirm={() => close()} onCancel={close} />,
    legacyRender: (close) => <LegacyCreateModelModal onConfirm={() => close()} onCancel={close} />,
  },
  {
    id: "model-add-step",
    name: "AddStepModal",
    module: "Manage · Model Management",
    file: "src/pages/model-management/index.tsx",
    kind: "modal",
    trigger: "Model editor → Add Step.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version.",
    render: (close) => <AddStepModal onConfirm={() => close()} onCancel={close} />,
    legacyRender: (close) => <LegacyAddStepModal onConfirm={() => close()} onCancel={close} />,
  },
  {
    id: "model-edit-step",
    name: "AddStepModal",
    module: "Manage · Model Management",
    file: "src/pages/model-management/index.tsx",
    kind: "modal",
    trigger: "Model editor → step → Edit.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version. Same shell, pre-filled from an existing step.",
    render: (close) => (
      <AddStepModal
        initial={{
          label: "Helmet Detection",
          actionLabel: "Detect helmets",
          modelFile: "helmet.onnx",
          manifestFile: "helmet.manifest.json",
          batchSize: 8,
        }}
        onConfirm={() => close()}
        onCancel={close}
      />
    ),
    legacyRender: (close) => (
      <LegacyAddStepModal
        initial={{
          label: "Helmet Detection",
          actionLabel: "Detect helmets",
          modelFile: "helmet.onnx",
          manifestFile: "helmet.manifest.json",
          batchSize: 8,
        }}
        onConfirm={() => close()}
        onCancel={close}
      />
    ),
  },
  {
    id: "model-delete",
    name: "DeleteModelModal",
    module: "Manage · Model Management",
    file: "src/pages/model-management/index.tsx",
    kind: "confirm",
    trigger: "Model Management → model → Delete.",
    note: "Gallery copy with the unified confirm look — the page still uses its own version.",
    render: (close) => <DeleteNamedCopy kind="Model" name="PPE Compliance v3" references="deployments" onClose={close} />,
  },
  {
    id: "model-extract-rules",
    name: "ExtractRulesPrompt",
    module: "Manage · Model Management",
    file: "src/pages/model-management/index.tsx",
    kind: "modal",
    trigger: "After a model file upload — offers rule extraction.",
    note: "Restyled in place (plain header) — the page still uses its own version.",
    render: (close) => (
      <ExtractRulesPrompt modelFile="helmet.onnx" onConfirm={close} onSkip={close} />
    ),
  },

  {
    id: "model-add-rule",
    name: "AddRuleModal",
    module: "Manage · Model Management",
    file: "src/pages/model-management/index.tsx",
    kind: "modal",
    trigger: "Model Management → edit a model → Rules → Add rule.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version. Search and multi-pick from rules not yet on the model.",
    render: (close) => <AddRuleModal rules={MOCK_RULES} onCancel={close} onAdd={() => close()} />,
    legacyRender: (close) => <LegacyAddRuleModal rules={MOCK_RULES} onCancel={close} onAdd={() => close()} />,
  },

  /* ── Rules Library ────────────────────────────────────────────────────── */
  {
    id: "rule-delete",
    name: "DeleteModal",
    module: "Manage · Rules Library",
    file: "src/pages/rules-library/index.tsx",
    kind: "confirm",
    trigger: "Rules Library → rule → Delete.",
    note: "Gallery copy with the unified confirm look — the page still uses its own version.",
    render: (close) => <DeleteNamedCopy kind="Rule" name="No helmet in Loading Bay" references="models" onClose={close} />,
  },

  {
    id: "rule-condition",
    name: "ConditionModal",
    module: "Manage · Rules Library",
    file: "src/pages/rules-library/RuleConditions.tsx",
    kind: "modal",
    trigger: "Rules Library → open a rule → Conditions → Add condition.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version. New-condition copy; editing an existing one uses the same shell.",
    render: (close) => (
      <ConditionModal condition={newCondition(EVENT_TEMPLATES[0])} isNew onClose={close} onSave={() => close()} />
    ),
    legacyRender: (close) => (
      <LegacyConditionModal condition={newCondition(EVENT_TEMPLATES[0])} isNew onClose={close} onSave={() => close()} />
    ),
  },

  /* ── Incident Cases ───────────────────────────────────────────────────── */
  {
    id: "case-drawer",
    name: "CaseDrawer",
    module: "Manage · Incident Cases",
    file: "src/pages/incident-cases/CaseDrawer.tsx",
    kind: "drawer",
    trigger: "Incident Cases → click a case.",
    note: "Hosts the status / reassign / edit / delete modals.",
    render: (close) => <CaseDrawer caseId={incidentCase.id} onClose={close} />,
  },
  {
    id: "case-drawer-loading",
    name: "CaseDrawer",
    module: "Manage · Incident Cases",
    file: "src/pages/incident-cases/CaseDrawer.tsx",
    kind: "drawer",
    trigger: "Same drawer while the case is loading.",
    note: "forcedState=\"loading\".",
    render: (close) => <CaseDrawer caseId={incidentCase.id} onClose={close} forcedState="loading" />,
  },
  {
    id: "case-drawer-error",
    name: "CaseDrawer",
    module: "Manage · Incident Cases",
    file: "src/pages/incident-cases/CaseDrawer.tsx",
    kind: "drawer",
    trigger: "Same drawer when the case fails to load.",
    note: "forcedState=\"error\" — includes the retry action.",
    render: (close) => (
      <CaseDrawer caseId={incidentCase.id} onClose={close} forcedState="error" onRetry={() => undefined} />
    ),
  },
  {
    id: "case-change-status",
    name: "ChangeStatusModal",
    module: "Manage · Incident Cases",
    file: "src/pages/incident-cases/CaseDrawer.tsx",
    kind: "modal",
    trigger: "Case drawer → Update Case → Change status.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version.",
    render: (close) => (
      <ChangeStatusModal open currentStatus="open" onClose={close} onConfirm={() => close()} />
    ),
    legacyRender: (close) => (
      <LegacyChangeStatusModal open currentStatus="open" onClose={close} onConfirm={() => close()} />
    ),
  },
  {
    id: "case-reassign",
    name: "ReassignModal",
    module: "Manage · Incident Cases",
    file: "src/pages/incident-cases/CaseDrawer.tsx",
    kind: "modal",
    trigger: "Case drawer → Update Case → Reassign.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version.",
    render: (close) => (
      <ReassignModal open current={ASSIGNEES[0]} onClose={close} onConfirm={() => close()} />
    ),
    legacyRender: (close) => (
      <LegacyReassignModal open current={ASSIGNEES[0]} onClose={close} onConfirm={() => close()} />
    ),
  },
  {
    id: "case-link-incidents",
    name: "LinkNewIncidentsModal",
    module: "Manage · Incident Cases",
    file: "src/pages/incident-cases/CaseDrawer.tsx",
    kind: "modal",
    trigger: "Case drawer → Update Case → Link incidents.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version.",
    render: (close) => (
      <LinkNewIncidentsModal
        open
        caseSite={incidentCase.site}
        alreadyLinked={[]}
        onClose={close}
        onConfirm={() => close()}
      />
    ),
    legacyRender: (close) => (
      <LegacyLinkNewIncidentsModal
        open
        caseSite={incidentCase.site}
        alreadyLinked={[]}
        onClose={close}
        onConfirm={() => close()}
      />
    ),
  },
  {
    id: "case-edit",
    name: "EditCaseModal",
    module: "Manage · Incident Cases",
    file: "src/pages/incident-cases/CaseDrawer.tsx",
    kind: "modal",
    trigger: "Case drawer → Update Case → Edit details.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version.",
    render: (close) => (
      <EditCaseModal
        open
        title={incidentCase.title}
        severity={incidentCase.severity}
        notes=""
        onClose={close}
        onConfirm={() => close()}
      />
    ),
    legacyRender: (close) => (
      <LegacyEditCaseModal
        open
        title={incidentCase.title}
        severity={incidentCase.severity}
        notes=""
        onClose={close}
        onConfirm={() => close()}
      />
    ),
  },
  {
    id: "case-delete",
    name: "DeleteCaseModal",
    module: "Manage · Incident Cases",
    file: "src/pages/incident-cases/CaseDrawer.tsx",
    kind: "confirm",
    trigger: "Case drawer → Update Case → Delete case.",
    note: "Gallery copy with the unified confirm look — the page still uses its own version.",
    render: (close) => <DeleteCaseCopy caseTitle={incidentCase.title} onClose={close} />,
  },
  {
    id: "entity-drawer",
    name: "EntityDrawer",
    module: "Manage · Incident Cases",
    file: "src/pages/incident-cases/EntityDrawer.tsx",
    kind: "drawer",
    trigger: "Case or event drawer → click an entity chip.",
    render: (close) => <EntityDrawer entity={entity} open onClose={close} />,
  },
  {
    id: "floor-plan-remove",
    name: "ConfirmDialog (Remove floor plan)",
    module: "Site · Overview",
    file: "src/pages/site/overview/SiteDetailDrawer.tsx",
    kind: "confirm",
    trigger: "Floor-plan editor → Remove floor plan.",
    note: "Redesigned copy — the page still uses its own version. Built inline with ConfirmDialog.",
    render: (close) => <RemoveFloorPlanCopy siteName={FLOOR_PLAN_SITE} onClose={close} />,
  },
];
