import * as React from "react";
import { LoaderCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Canonical confirm / destructive-action modal. Replaces the 9 hand-rolled
 * delete / confirm modals that each rebuilt Dialog + warning + buttons.
 *
 * Built on the shared `Modal` shell, so it renders the same header / body /
 * footer chrome as every page modal instead of raw shadcn defaults.
 */
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** The body's one line — phrase it "Are you sure you want to…" with the item in bold. */
  description: React.ReactNode;
  /** Deprecated — titles carry no icon in the current look. Accepted for old callers. */
  icon?: LucideIcon;
  confirmLabel?: string;
  /** Deprecated — confirms have no Cancel button (✕ / Esc close). Accepted for old callers. */
  cancelLabel?: string;
  /** Destructive styles the confirm button and signals an irreversible action. */
  destructive?: boolean;
  /** Disables buttons and shows a spinner on confirm. */
  loading?: boolean;
  onConfirm: () => void;
  /** Extra content between description and footer (e.g. an affected-items list). */
  children?: React.ReactNode;
  /** Shell width — defaults to the compact confirm size. */
  size?: "sm" | "lg";
  className?: string;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  onConfirm,
  children,
  size = "sm",
  className,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size={size} className={cn(className)}>
        {/* Neutral title; the description is the body's one "Are you sure…" line. */}
        <ModalHeader title={title} />
        <ModalBody className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          {children}
        </ModalBody>
        {/* One action — the ✕ / Esc close, so there is no Cancel button. */}
        <ModalFooter>
          <Button
            size="sm"
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <LoaderCircle className="animate-spin" />}
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export { ConfirmDialog };
