/**
 * Frozen copy of src/pages/profile/index.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/profile/index.tsx.
 */
import * as React from "react";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { PasswordStrengthBar, isStrongPassword } from "@/components/shared/PasswordStrengthBar";
import { cn } from "@/lib/utils";

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNext, setShowNext] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [errors, setErrors] = React.useState<{ current?: string; next?: string; confirm?: string }>({});

  React.useEffect(() => {
    if (open) {
      setCurrent(""); setNext(""); setConfirm("");
      setShowCurrent(false); setShowNext(false); setShowConfirm(false);
      setErrors({});
    }
  }, [open]);

  const matches = next.length > 0 && next === confirm;

  function submit() {
    const nextErrors: { current?: string; next?: string; confirm?: string } = {};
    if (current.length === 0) nextErrors.current = "Enter your current password.";
    if (next.length < 8) nextErrors.next = "Use at least 8 characters.";
    else if (!isStrongPassword(next))
      nextErrors.next = "Choose a stronger password (mix upper/lowercase, numbers, or symbols).";
    if (!matches) nextErrors.confirm = "Passwords don't match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onClose();
    toast.success("Password updated", { description: "You will stay signed in on this device." });
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Change Password"
          description="You'll stay signed in on this device — other sessions are signed out."
        />
        <ModalBody className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Password</label>
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} value={current} aria-invalid={!!errors.current} onChange={(e) => { setCurrent(e.target.value); if (errors.current) setErrors((p) => ({ ...p, current: undefined })); }} className="h-9 pr-9 text-base" />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            {errors.current && <p className="mt-1 text-xs text-sev-critical">{errors.current}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
            <div className="relative">
              <Input type={showNext ? "text" : "password"} value={next} aria-invalid={!!errors.next} placeholder="At least 8 characters" onChange={(e) => { setNext(e.target.value); if (errors.next) setErrors((p) => ({ ...p, next: undefined })); }} className="h-9 pr-9 text-base" />
              <button type="button" onClick={() => setShowNext((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNext ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            {/* Same strength meter the sign-up flow uses, instead of a rules checklist. */}
            <PasswordStrengthBar className="mt-1.5" password={next} />
            {errors.next && <p className="mt-1 text-xs text-sev-critical">{errors.next}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</label>
            <div className="relative">
              <Input type={showConfirm ? "text" : "password"} value={confirm} aria-invalid={!!errors.confirm} placeholder="Re-type your password" onChange={(e) => { setConfirm(e.target.value); if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined })); }} className="h-9 pr-9 text-base" />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            {errors.confirm && <p className="mt-1 text-xs text-sev-critical">{errors.confirm}</p>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} className="gap-1.5">
            <KeyRound className="size-3.5" />
            Update Password
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function TwoFAModal({ open, onClose, onEnable }: { open: boolean; onClose: () => void; onEnable: () => void }) {
  const [code, setCode] = React.useState("");
  const [errors, setErrors] = React.useState<{ code?: string }>({});
  React.useEffect(() => { if (open) { setCode(""); setErrors({}); } }, [open]);

  function submit() {
    if (code.length !== 6) {
      setErrors({ code: "Enter the 6-digit code." });
      return;
    }
    setErrors({});
    onEnable();
    onClose();
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Enable Two-Factor Authentication"
          description="Scan the QR code with your authenticator app, then enter the 6-digit code."
        />
        <ModalBody className="space-y-4">
          <div className="flex justify-center">
            <div className="flex size-44 items-center justify-center rounded-lg border border-border bg-background p-3">
              <div className="grid size-full grid-cols-12 grid-rows-12 gap-px">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className={cn("rounded-[1px]", ((i * 37) % 7 < 3 || i % 5 === 0) ? "bg-foreground" : "bg-transparent")} />
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-center">
            <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Or enter this key</p>
            <p className="mt-0.5 font-mono text-sm text-foreground">JBSWY3DPEHPK3PXPEHPK3PXPEHPK3PXP</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">6-digit verification code</label>
            <Input value={code} aria-invalid={!!errors.code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); if (errors.code) setErrors((p) => ({ ...p, code: undefined })); }} placeholder="000000" maxLength={6}
              className="h-10 text-center font-mono text-xl tracking-[0.5em]" />
            {errors.code && <p className="mt-1 text-xs text-sev-critical">{errors.code}</p>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} className="gap-1.5">
            <ShieldCheck className="size-3.5" />
            Enable 2FA
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
