import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AccountSetup, type AccountProfile } from "./AccountSetup";
import { OtpVerify } from "./OtpVerify";
import { WelcomeModal } from "./WelcomeModal";
import { MOCK_INVITE } from "./shared";

/* The flow an invited user goes through after an admin invites them from User
   Management. Distinct from self-serve signup: the seat, role and site access
   are already assigned, so there is no plan or payment step — the invitee only
   completes their profile and verifies their email.

   Setup → verify email code → welcome → dashboard. */

type Stage = "setup" | "verify" | "welcome";

export default function InviteSignupPage() {
  const navigate = useNavigate();
  const [stage, setStage] = React.useState<Stage>("setup");
  const [profile, setProfile] = React.useState<AccountProfile | null>(null);

  /* The invite context is decoded from the one-time token in the link. Until
     that endpoint exists, it comes from the same stand-in the prototype used. */
  const invite = MOCK_INVITE;

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {stage === "setup" ? (
        <AccountSetup
          invite={invite}
          onComplete={(p) => {
            setProfile(p);
            setStage("verify");
          }}
        />
      ) : (
        <OtpVerify
          email={invite.email}
          onVerified={() => setStage("welcome")}
          onBack={() => setStage("setup")}
        />
      )}

      <WelcomeModal
        open={stage === "welcome"}
        firstName={profile?.firstName ?? ""}
        invite={invite}
        onEnter={() => navigate("/", { replace: true })}
      />
    </div>
  );
}
