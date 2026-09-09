import { InviteUsersModal as SignUpInviteUsersModal } from "@/pages/auth/SignUp";
import { MemberModal } from "@/pages/auth/onprem/OnPremSetup";
import type { ModalEntry } from "../types";

export const AUTH_ENTRIES: ModalEntry[] = [
  {
    id: "signup-invite-users",
    name: "InviteUsersModal",
    module: "Auth · Cloud Sign-up",
    file: "src/pages/auth/SignUp.tsx",
    kind: "modal",
    trigger: "Sign-up → Invite your team step → Invite users.",
    note: "Sign-up variant — no seat accounting yet.",
    render: (close) => (
      <SignUpInviteUsersModal
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
    render: (close) => (
      <MemberModal
        open
        onClose={close}
        onInvite={() => close()}
        siteName="Sembawang Naval"
        currentMembers={[]}
      />
    ),
  },
];
