import { RunConfirmModal, PurchaseRunsModal, DeleteAnalysisModal, HistoryDetailDrawer } from "@/pages/run-analysis";
import { DeployConfirmModal, ModelDeploymentsDrawer, type ModelAggregate } from "@/pages/model-deployment";
import { MOCK_MODELS } from "@/mocks/modelManagement";
import { MOCK_DEPLOYMENTS, getSiteSummaries, getAreaSummaries } from "@/mocks/deployments";
import { MOCK_CAMERAS } from "@/mocks/cameras";
import { MOCK_PAST_ANALYSES } from "@/mocks/runAnalysis";
import type { ModalEntry } from "../types";

const site = getSiteSummaries()[0];
const areas = getAreaSummaries(site.siteId).slice(0, 2);
const cameras = MOCK_CAMERAS.filter((c) => c.siteId === site.siteId).slice(0, 3);
const analysis = MOCK_PAST_ANALYSES[0];

/** The deployments drawer takes the page's per-model rollup — rebuilt here from mocks. */
const modelAggregate: ModelAggregate = (() => {
  const deployments = MOCK_DEPLOYMENTS.filter((d) => d.modelId === MOCK_DEPLOYMENTS[0].modelId);
  return {
    modelId: deployments[0].modelId,
    modelName: deployments[0].modelName,
    totalCameras: deployments.length,
    active: deployments.filter((d) => d.status === "active").length,
    paused: deployments.filter((d) => d.status === "paused").length,
    failed: deployments.filter((d) => d.status === "failed").length,
    totalEvents: deployments.reduce((sum, d) => sum + d.eventCount, 0),
    health: "healthy",
    deployments,
  };
})();

export const DEPLOY_ENTRIES: ModalEntry[] = [
  {
    id: "run-confirm",
    name: "RunConfirmModal",
    module: "Deploy · Run Analysis",
    file: "src/pages/run-analysis/index.tsx",
    kind: "modal",
    trigger: "Run Analysis → Run — the cost breakdown before committing.",
    render: (close) => (
      <RunConfirmModal
        open
        onClose={close}
        onConfirm={close}
        clipSec={420}
        freeCoverSec={120}
        paidMinutes={5}
        tokenCost={50}
        tokenBalance={320}
      />
    ),
  },
  {
    id: "run-purchase",
    name: "PurchaseRunsModal",
    module: "Deploy · Run Analysis",
    file: "src/pages/run-analysis/index.tsx",
    kind: "modal",
    trigger: "Run Analysis → Buy tokens (or from an insufficient-balance run).",
    render: (close) => (
      <PurchaseRunsModal open onClose={close} tokenBalance={320} onBuyTokens={() => close()} />
    ),
  },
  {
    id: "run-history-drawer",
    name: "HistoryDetailDrawer",
    module: "Deploy · Run Analysis",
    file: "src/pages/run-analysis/index.tsx",
    kind: "drawer",
    trigger: "Run Analysis → History → click a past run.",
    note: "Hand-rolled overlay, not a Radix Sheet — clicking the backdrop closes it, Esc does not.",
    render: (close) => <HistoryDetailDrawer analysis={analysis} onClose={close} />,
  },
  {
    id: "run-delete-analysis",
    name: "DeleteAnalysisModal",
    module: "Deploy · Run Analysis",
    file: "src/pages/run-analysis/index.tsx",
    kind: "confirm",
    trigger: "Run Analysis → History → row menu → Delete.",
    render: (close) => (
      <DeleteAnalysisModal
        target={{ id: analysis.id, name: analysis.name }}
        onCancel={close}
        onConfirm={close}
      />
    ),
  },
  {
    id: "deploy-confirm",
    name: "DeployConfirmModal",
    module: "Deploy · Model Deployment",
    file: "src/pages/model-deployment/index.tsx",
    kind: "modal",
    trigger: "Model Deployment → Deploy Model → final Review step.",
    note: "Last step of the deploy wizard; the wizard itself is an inline page, not a modal.",
    render: (close) => (
      <DeployConfirmModal
        open
        model={MOCK_MODELS[0]}
        site={site}
        areas={areas}
        cameras={cameras}
        confidence={85}
        camerasWithZones={1}
        onClose={close}
        onConfirm={close}
      />
    ),
  },
  {
    id: "model-deployments-drawer",
    name: "ModelDeploymentsDrawer",
    module: "Deploy · Model Deployment",
    file: "src/pages/model-deployment/index.tsx",
    kind: "drawer",
    trigger: "Model Deployment → click a model row.",
    note: "Hand-rolled overlay, not a Radix Sheet — backdrop click closes it, Esc does not.",
    render: (close) => (
      <ModelDeploymentsDrawer model={modelAggregate} onClose={close} onOpenCamera={() => undefined} />
    ),
  },
];
