import { InviteUsersModal as SignUpInviteUsersModal } from "@/pages/auth/SignUp";
import { MemberModal } from "@/pages/auth/onprem/OnPremSetup";
import { WelcomeModal } from "@/pages/auth/invite/WelcomeModal";
import { MOCK_INVITE } from "@/pages/auth/invite/shared";
import type { ModalEntry } from "../types";
import { InviteUsersModal as LegacySignUpInviteUsersModal } from "@/pages/dev/modals/legacy/pages/auth/SignUp";
import { MemberModal as LegacyMemberModal } from "@/pages/dev/modals/legacy/pages/auth/onprem/OnPremSetup";

export const AUTH_ENTRIES: ModalEntry[] = [
  {
    id: "signup-invite-users",
    name: "InviteUsersModal",
    module: "Auth · Cloud Sign-up",
    file: "src/pages/auth/SignUp.tsx",
    kind: "modal",
    trigger: "Sign-up → Invite your team step → Invite users.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version. Sign-up variant — no seat accounting yet.",
    render: (close) => (
      <SignUpInviteUsersModal
        open
        onClose={close}
        onInvite={() => close()}
        siteName="Astra HQ"
        currentInvites={[]}
      />
    ),
    legacyRender: (close) => (
      <LegacySignUpInviteUsersModal
        open
        onClose={close}
        onInvite={() => close()}
        siteName="Astra HQ"
        currentInvites={[]}
      />
    ),
  },
  {
    id: "onprem-member",
    name: "MemberModal",
    module: "Auth · On-Premise Setup",
    file: "src/pages/auth/onprem/OnPremSetup.tsx",
    kind: "modal",
    trigger: "On-prem setup → Members step → Add members.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version.",
    render: (close) => (
      <MemberModal
        open
        onClose={close}
        onInvite={() => close()}
        siteName="Sembawang Naval"
        currentMembers={[]}
      />
    ),
    legacyRender: (close) => (
      <LegacyMemberModal
        open
        onClose={close}
        onInvite={() => close()}
        siteName="Sembawang Naval"
        currentMembers={[]}
      />
    ),
  },
  {
    id: "invite-welcome",
    name: "WelcomeModal",
    module: "Auth · Invite",
    file: "src/pages/auth/invite/WelcomeModal.tsx",
    kind: "modal",
    trigger: "Accept an invite → finish profile → welcome.",
    note: "Restyled in place (plain header, 550px, scrolls, no Cancel) — the page still uses its own version. Can't be dismissed — Esc and backdrop are blocked; only “Enter dashboard” closes it.",
    render: (close) => <WelcomeModal open firstName="Alex" invite={MOCK_INVITE} onEnter={close} />,
  },
];
