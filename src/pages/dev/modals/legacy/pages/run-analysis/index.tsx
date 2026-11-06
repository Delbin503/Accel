/**
 * Frozen copy of src/pages/run-analysis/index.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/run-analysis/index.tsx.
 */
import { CheckCircle2, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { CoinIcon } from "@/components/shared/CoinIcon";
import { cn } from "@/lib/utils";

/** Human "8 Min 50 Sec" / "10 Min" / "45 Sec" for a duration in seconds. */
function formatMinSec(sec: number): string {
  const total = Math.max(0, Math.round(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m > 0 && s > 0) return `${m} Min ${s} Sec`;
  if (m > 0) return `${m} Min`;
  return `${s} Sec`;
}

/* ── Run confirmation modal — review usage & confirm ────────────────────── */

export function RunConfirmModal({
  open,
  onClose,
  onConfirm,
  clipSec,
  freeCoverSec,
  paidMinutes,
  tokenCost,
  tokenBalance,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clipSec: number;
  freeCoverSec: number;
  paidMinutes: number;
  tokenCost: number;
  tokenBalance: number;
}) {
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader
          title="Confirm analysis run"
          description="Start the analysis against your uploaded footage. Free-trial minutes are used first, then token credits."
          icon={Sparkles}
        />

        <ModalBody className="space-y-4">
          {/* Hero — what this run costs */}
          <div
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border py-5 text-center",
              tokenCost > 0
                ? "border-primary/25 bg-primary/[0.06]"
                : "border-success/25 bg-success/[0.06]"
            )}
          >
            <span className="text-2xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Tokens to be consumed
            </span>
            {tokenCost > 0 ? (
              <span className="flex items-center gap-2 font-mono text-3xl font-bold text-primary">
                <CoinIcon className="size-6" />
                {tokenCost.toLocaleString()}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-2xl font-bold text-success">
                <CheckCircle2 className="size-6" />
                Free
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {tokenCost > 0
                ? <>Balance after this run: <span className="font-semibold text-foreground">{(tokenBalance - tokenCost).toLocaleString()}</span> Tokens</>
                : "Covered entirely by your free trial"}
            </span>
          </div>

          {/* Breakdown */}
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
              <span className="text-muted-foreground">Clip length</span>
              <span className="font-semibold text-foreground">{formatMinSec(clipSec)}</span>
            </div>
            {freeCoverSec > 0 && (
              <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                <span className="text-muted-foreground">From free trial</span>
                <span className="font-semibold text-success">{formatMinSec(freeCoverSec)}</span>
              </div>
            )}
            {paidMinutes > 0 && (
              <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                <span className="text-muted-foreground">Billed to Tokens</span>
                <span className="font-semibold text-foreground">
                  {paidMinutes} Min · {tokenCost.toLocaleString()} Tokens
                </span>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onConfirm}>
            <Sparkles className="size-3.5" />
            Proceed
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ─── Delete-analysis confirm ────────────────────────────────────────────── */

/**
 * Confirms removing a past run from history. Extracted from the history tab so
 * it can be mounted standalone (the modal gallery does exactly that).
 */
export function DeleteAnalysisModal({
  target,
  onCancel,
  onConfirm,
}: {
  target: { id: string; name: string } | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={!!target} onOpenChange={(v) => !v && onCancel()}>
      <ModalContent size="sm">
        <ModalHeader
          title="Delete Analysis"
          description="This action cannot be undone."
          icon={Trash2}
          tone="destructive"
        />
        {target && (
          <ModalBody className="text-base text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{target.id}</span>{" "}
            <span className="font-semibold text-foreground">— {target.name}</span>? Any
            references to this run from validation history will be removed.
          </ModalBody>
        )}
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" className="gap-1.5" onClick={onConfirm}>
            <Trash2 className="size-3.5" />
            Delete Analysis
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
