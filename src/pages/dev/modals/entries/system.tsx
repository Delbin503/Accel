import {
  UserDrawer, InviteUsersModal, ChangeRoleModal, ManageSiteModal, EditUserModal,
  SuspendUserModal, ReinstateModal, DeleteUserModal, ResetConfirmModal,
  type SeatUsage,
} from "@/pages/user-management";
import { ChangePasswordModal, TwoFAModal } from "@/pages/profile";
import { DeleteAccountModal } from "@/pages/settings";
import { AddCardModal, RetryPaymentModal, PurchasePlanModal, InvoiceDetailDrawer } from "@/pages/billing";
import { MOCK_USERS } from "@/mocks/users";
import type { UserRole } from "@/types/users";
import { MOCK_SEATS, MOCK_INVOICES } from "@/mocks/licenses";
import type { ModalEntry } from "../types";

const user = MOCK_USERS[1];
/** Seat rollup the user-management page normally computes from live users. */
const seatUsage: Record<UserRole, SeatUsage> = (["owner", "admin", "user"] as UserRole[]).reduce(
  (acc, role) => {
    const total = role === "owner" ? 1 : MOCK_SEATS[role].total;
    const assigned = MOCK_USERS.filter((u) => u.role === role).length;
    acc[role] = {
      role,
      total,
      assigned,
      available: Math.max(0, total - assigned),
      price: MOCK_SEATS[role].pricePerMonth,
      label: MOCK_SEATS[role].label,
    };
    return acc;
  },
  {} as Record<UserRole, SeatUsage>,
);

const cards = [
  { id: "card-1", brand: "Visa" as const, last4: "6411", expiryMonth: "04", expiryYear: "28", isDefault: true },
  { id: "card-2", brand: "Mastercard" as const, last4: "2210", expiryMonth: "11", expiryYear: "27", isDefault: false },
];

const failedInvoice = MOCK_INVOICES.find((i) => i.status === "failed") ?? MOCK_INVOICES[0];

export const SYSTEM_ENTRIES: ModalEntry[] = [
  /* ── User Management ──────────────────────────────────────────────────── */
  {
    id: "user-drawer",
    name: "UserDrawer",
    module: "System · User Management",
    file: "src/pages/user-management/index.tsx",
    kind: "drawer",
    trigger: "User Management → click a user row.",
    render: (close) => (
      <UserDrawer
        user={user}
        open
        onClose={close}
        onEdit={() => undefined}
        onChangeRole={() => undefined}
        onManageSite={() => undefined}
        onSuspend={() => undefined}
        onReinstate={() => undefined}
        onDelete={() => undefined}
        onResetPassword={() => undefined}
        onReset2FA={() => undefined}
      />
    ),
  },
  {
    id: "user-drawer-deleted",
    name: "UserDrawer",
    module: "System · User Management",
    file: "src/pages/user-management/index.tsx",
    kind: "drawer",
    trigger: "User Management → Deleted tab → click a row.",
    note: "mode=\"deleted\" — read-only with restore.",
    render: (close) => (
      <UserDrawer
        user={user}
        open
        mode="deleted"
        deletedMeta={{ deletedAtDisplay: "12 Aug 2026, 09:41", deletedBy: "Delbin Arkar", deleteReason: "Left the company." }}
        onClose={close}
        onEdit={() => undefined}
        onChangeRole={() => undefined}
        onManageSite={() => undefined}
        onSuspend={() => undefined}
        onReinstate={() => undefined}
        onDelete={() => undefined}
        onRestore={() => undefined}
        onResetPassword={() => undefined}
        onReset2FA={() => undefined}
      />
    ),
  },
  {
    id: "user-invite",
    name: "InviteUsersModal",
    module: "System · User Management",
    file: "src/pages/user-management/index.tsx",
    kind: "modal",
    trigger: "User Management → Invite Users.",
    note: "Seat availability gates the role picker.",
    render: (close) => (
      <InviteUsersModal open onClose={close} onInvite={() => close()} seatUsage={seatUsage} />
    ),
  },
  {
    id: "user-change-role",
    name: "ChangeRoleModal",
    module: "System · User Management",
    file: "src/pages/user-management/index.tsx",
    kind: "modal",
    trigger: "User row menu → Change role.",
    note: "Offers a seat purchase when the target role is full.",
    render: (close) => (
      <ChangeRoleModal
        open
        users={[user]}
        seatUsage={seatUsage}
        onClose={close}
        onConfirm={() => close()}
        onPurchaseSeat={() => undefined}
      />
    ),
  },
  {
    id: "user-manage-sites",
    name: "ManageSiteModal",
    module: "System · User Management",
    file: "src/pages/user-management/index.tsx",
    kind: "modal",
    trigger: "User row menu → Manage site access.",
    render: (close) => (
      <ManageSiteModal open users={[user]} onClose={close} onConfirm={() => close()} />
    ),
  },
  {
    id: "user-edit",
    name: "EditUserModal",
    module: "System · User Management",
    file: "src/pages/user-management/index.tsx",
    kind: "modal",
    trigger: "User row menu → Edit user.",
    render: (close) => (
      <EditUserModal open user={user} onClose={close} onConfirm={() => close()} />
    ),
  },
  {
    id: "user-suspend",
    name: "SuspendUserModal",
    module: "System · User Management",
    file: "src/pages/user-management/index.tsx",
    kind: "modal",
    trigger: "User row menu → Suspend.",
    note: "Duration + reason capture.",
    render: (close) => (
      <SuspendUserModal open users={[user]} onClose={close} onConfirm={() => close()} />
    ),
  },
  {
    id: "user-reinstate",
    name: "ReinstateModal",
    module: "System · User Management",
    file: "src/pages/user-management/index.tsx",
    kind: "confirm",
    trigger: "Suspended user → Reinstate.",
    render: (close) => (
      <ReinstateModal open users={[user]} onClose={close} onConfirm={close} />
    ),
  },
  {
    id: "user-delete",
    name: "DeleteUserModal",
    module: "System · User Management",
    file: "src/pages/user-management/index.tsx",
    kind: "confirm",
    trigger: "User row menu → Delete.",
    note: "Captures a deletion note for the audit trail.",
    render: (close) => (
      <DeleteUserModal open users={[user]} onClose={close} onConfirm={() => close()} />
    ),
  },
  {
    id: "user-reset-confirm",
    name: "ResetConfirmModal",
    module: "System · User Management",
    file: "src/pages/user-management/index.tsx",
    kind: "confirm",
    trigger: "User row menu → Reset password / Reset 2FA.",
    render: (close) => (
      <ResetConfirmModal
        open
        title="Reset 2FA"
        description="The user re-enrols a new authenticator on their next sign-in."
        confirmLabel="Reset 2FA"
        onClose={close}
        onConfirm={close}
        detail={
          <>
            <strong className="text-foreground">{user.fullName}</strong>'s current authenticator stops working
            immediately. They'll be walked through enrolment the next time they sign in.
          </>
        }
      />
    ),
  },

  /* ── Account ──────────────────────────────────────────────────────────── */
  {
    id: "profile-change-password",
    name: "ChangePasswordModal",
    module: "Account · Profile",
    file: "src/pages/profile/index.tsx",
    kind: "modal",
    trigger: "Profile → Change password.",
    render: (close) => <ChangePasswordModal open onClose={close} />,
  },
  {
    id: "profile-2fa",
    name: "TwoFAModal",
    module: "Account · Profile",
    file: "src/pages/profile/index.tsx",
    kind: "modal",
    trigger: "Profile → Two-factor authentication → Enable.",
    note: "QR enrolment + code verification.",
    render: (close) => <TwoFAModal open onClose={close} onEnable={close} />,
  },
  {
    id: "settings-delete-account",
    name: "DeleteAccountModal",
    module: "Account · Settings",
    file: "src/pages/settings/index.tsx",
    kind: "confirm",
    trigger: "Settings → Danger zone → Delete workspace.",
    note: "Type-to-confirm on the org name.",
    render: (close) => <DeleteAccountModal onClose={close} orgName="Astra Security" />,
  },
  {
    id: "billing-add-card",
    name: "AddCardModal",
    module: "Account · Billing",
    file: "src/pages/billing/index.tsx",
    kind: "modal",
    trigger: "Billing → Payment methods → Add card.",
    render: (close) => <AddCardModal open onClose={close} onSave={() => close()} />,
  },
  {
    id: "billing-retry-payment",
    name: "RetryPaymentModal",
    module: "Account · Billing",
    file: "src/pages/billing/index.tsx",
    kind: "modal",
    trigger: "Billing → failed invoice → Retry payment.",
    render: (close) => (
      <RetryPaymentModal
        open
        invoice={failedInvoice}
        cards={cards}
        onClose={close}
        onAddCard={() => undefined}
        onConfirm={() => close()}
      />
    ),
  },
  {
    id: "billing-invoice-drawer",
    name: "InvoiceDetailDrawer",
    module: "Account · Billing",
    file: "src/pages/billing/index.tsx",
    kind: "drawer",
    trigger: "Billing → Invoices → click an invoice row.",
    note: "Hand-rolled overlay, not a Radix Sheet — backdrop click closes it, Esc does not.",
    render: (close) => (
      <InvoiceDetailDrawer invoice={failedInvoice} onRetryPayment={() => undefined} onClose={close} />
    ),
  },
  {
    id: "billing-purchase-plan",
    name: "PurchasePlanModal",
    module: "Account · Billing",
    file: "src/pages/billing/index.tsx",
    kind: "modal",
    trigger: "Billing → plan card → Upgrade / Purchase.",
    render: (close) => (
      <PurchasePlanModal
        tier="professional"
        cycle="annual"
        cards={cards}
        onClose={close}
        onAddCard={() => undefined}
        onConfirm={() => close()}
      />
    ),
  },
];
