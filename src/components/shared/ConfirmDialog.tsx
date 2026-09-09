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
  /** Shown under the title. Required so the header always explains the action. */
  description: React.ReactNode;
  /** Optional glyph beside the title (defaults to none). */
  icon?: LucideIcon;
  confirmLabel?: string;
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
  icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
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
        <ModalHeader
          title={title}
          description={description}
          icon={icon}
          tone={destructive ? "destructive" : "default"}
        />
        {children ? (
          <ModalBody className="space-y-3">{children}</ModalBody>
        ) : null}
        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
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
