import * as React from "react";
import { createRoot } from "react-dom/client";
import { Mail, Clock, Users, Tag, FileCode2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "./proto.css";

import invitationHtml from "./templates/invitation.html?raw";
import otpHtml from "./templates/otp-verification.html?raw";
import signinCodeHtml from "./templates/signin-code.html?raw";
import passwordResetHtml from "./templates/password-reset-request.html?raw";
import passwordChangedHtml from "./templates/password-changed.html?raw";
import twoFaHtml from "./templates/2fa-changed.html?raw";
import welcomeHtml from "./templates/welcome.html?raw";
import roleChangedHtml from "./templates/role-changed.html?raw";
import ownershipHtml from "./templates/ownership-transfer.html?raw";

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
  priority: "P1" | "P2" | "P3";
  whenSent: string;
  audience: string;
  mergeTags: string[];
  file: string;
  html: string;
}

const TEMPLATES: Template[] = [
  {
    id: "otp-verification",
    name: "Email Verification / OTP Code",
    subject: "Your Accel verification code",
    category: "Account & Authentication",
    priority: "P1",
    whenSent:
      "During account setup (invite → signup) and whenever a user changes their email address.",
    audience: "The individual user verifying their email.",
    mergeTags: ["{{firstName}}", "{{code}}", "{{expiryMinutes}}", "{{supportEmail}}"],
    file: "templates/otp-verification.html",
    html: otpHtml,
  },
  {
    id: "signin-code",
    name: "Sign-in Verification Code",
    subject: "Your Accel sign-in code",
    category: "Account & Authentication",
    priority: "P1",
    whenSent: "At login, when two-factor authentication is enabled.",
    audience: "The user signing in.",
    mergeTags: ["{{firstName}}", "{{code}}", "{{expiryMinutes}}", "{{device}}", "{{location}}", "{{time}}", "{{supportEmail}}"],
    file: "templates/signin-code.html",
    html: signinCodeHtml,
  },
  {
    id: "password-reset-request",
    name: "Password Reset Request",
    subject: "Reset your Accel password",
    category: "Account & Authentication",
    priority: "P1",
    whenSent: "When a user requests a password reset. Delivers a verification code (not a link) to enter.",
    audience: "The user who requested the reset.",
    mergeTags: ["{{firstName}}", "{{code}}", "{{expiryMinutes}}", "{{requestedFrom}}", "{{supportEmail}}"],
    file: "templates/password-reset-request.html",
    html: passwordResetHtml,
  },
  {
    id: "password-changed",
    name: "Password Changed / Reset Confirmation",
    subject: "Your Accel password was changed",
    category: "Account & Authentication",
    priority: "P1",
    whenSent: "After a password is changed — by the user or forced by an admin.",
    audience: "The affected user.",
    mergeTags: ["{{firstName}}", "{{changedAt}}", "{{initiatedBy}}", "{{secureUrl}}", "{{supportEmail}}"],
    file: "templates/password-changed.html",
    html: passwordChangedHtml,
  },
  {
    id: "2fa-changed",
    name: "Two-Factor Authentication Changed",
    subject: "Two-factor authentication was updated",
    category: "Account & Authentication",
    priority: "P2",
    whenSent: "When a user enables or disables 2FA. {{action}} carries \"enabled\" / \"disabled\".",
    audience: "The affected user (and Owner if disabled on a privileged account).",
    mergeTags: ["{{firstName}}", "{{action}}", "{{changedAt}}", "{{email}}", "{{supportEmail}}"],
    file: "templates/2fa-changed.html",
    html: twoFaHtml,
  },
  {
    id: "welcome",
    name: "Welcome / Account Activated",
    subject: "Welcome to Accel",
    category: "Team & User Management",
    priority: "P1",
    whenSent: "Once an invited user finishes setup + email verification and their account is active.",
    audience: "The newly activated user.",
    mergeTags: ["{{firstName}}", "{{orgName}}", "{{role}}", "{{siteList}}", "{{dashboardUrl}}", "{{supportEmail}}"],
    file: "templates/welcome.html",
    html: welcomeHtml,
  },
  {
    id: "invitation",
    name: "User Invitation",
    subject: "You've been invited to Accel",
    category: "Team & User Management",
    priority: "P1",
    whenSent: "When an admin invites someone from the User Management panel.",
    audience: "The invited person (not yet a member).",
    mergeTags: ["{{orgName}}", "{{inviteeName}}", "{{siteName}}", "{{acceptUrl}}", "{{supportEmail}}"],
    file: "templates/invitation.html",
    html: invitationHtml,
  },
  {
    id: "role-changed",
    name: "Role Changed",
    subject: "Your role in Accel has been updated",
    category: "Team & User Management",
    priority: "P2",
    whenSent: "When an admin changes a user's role.",
    audience: "The user whose role changed.",
    mergeTags: ["{{firstName}}", "{{orgName}}", "{{previousRole}}", "{{newRole}}", "{{changedBy}}", "{{dashboardUrl}}", "{{supportEmail}}"],
    file: "templates/role-changed.html",
    html: roleChangedHtml,
  },
  {
    id: "ownership-transfer",
    name: "Ownership Transfer",
    subject: "Ownership of your Accel workspace was transferred",
    category: "Team & User Management",
    priority: "P1",
    whenSent: "When workspace ownership is transferred. Sent to both the outgoing and incoming Owner.",
    audience: "Outgoing and incoming Owner.",
    mergeTags: ["{{firstName}}", "{{orgName}}", "{{fromName}}", "{{toName}}", "{{transferredAt}}", "{{supportEmail}}"],
    file: "templates/ownership-transfer.html",
    html: ownershipHtml,
  },
];

const PRIORITY_STYLES: Record<Template["priority"], string> = {
  P1: "bg-sev-critical/15 text-sev-critical",
  P2: "bg-warning/15 text-warning",
  P3: "bg-muted text-muted-foreground",
};

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-t border-border py-3 first:border-t-0 first:pt-0">
      <span className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function App() {
  const [id, setId] = React.useState(TEMPLATES[0].id);
  const tpl = TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

  return (
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen w-full bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <svg width="30" height="27" viewBox="0 0 44 40" fill="none" aria-hidden>
                <path d="M23 2 L41 38 L31 38 L22.5 20.5 L14 38 L5 38 Z" fill="#FE5C01" />
                <path d="M4 38 C 12 28 22 25.5 34 29 C 24 27.5 15 31 11 38 Z" fill="#FE5C01" />
              </svg>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Accel · Email Templates</h1>
                <p className="text-xs text-muted-foreground">
                  Transactional email designs — switch to preview each one.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
                Template
              </span>
              <Select value={id} onValueChange={setId}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[320px_1fr]">
          {/* Info panel */}
          <aside className="h-fit rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className={cn("rounded-md px-1.5 py-0.5 text-2xs font-bold", PRIORITY_STYLES[tpl.priority])}>
                {tpl.priority}
              </span>
              <span className="text-2xs font-medium text-muted-foreground">{tpl.category}</span>
            </div>
            <h2 className="mb-4 text-base font-bold text-foreground">{tpl.name}</h2>

            <InfoRow icon={<Mail className="size-3" />} label="Subject line">
              {tpl.subject}
            </InfoRow>
            <InfoRow icon={<Clock className="size-3" />} label="When it's sent">
              {tpl.whenSent}
            </InfoRow>
            <InfoRow icon={<Users className="size-3" />} label="Audience">
              {tpl.audience}
            </InfoRow>
            <InfoRow icon={<Tag className="size-3" />} label="Merge tags">
              <div className="flex flex-wrap gap-1.5">
                {tpl.mergeTags.map((m) => (
                  <code
                    key={m}
                    className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-2xs text-primary"
                  >
                    {m}
                  </code>
                ))}
              </div>
            </InfoRow>
            <InfoRow icon={<FileCode2 className="size-3" />} label="Sendable file">
              <code className="font-mono text-xs text-muted-foreground">
                PRD_Email_Templates/{tpl.file}
              </code>
            </InfoRow>
          </aside>

          {/* Preview */}
          <main className="overflow-hidden rounded-xl border border-border bg-card">
            {/* Mock mail-client header */}
            <div className="border-b border-border px-5 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{tpl.subject}</p>
                <span className="text-2xs text-muted-foreground">Inbox preview</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                From <span className="text-foreground">Accel &lt;no-reply@accel.com&gt;</span>
              </p>
            </div>
            <div className="bg-[#0b0b0b] p-4 sm:p-8">
              <iframe
                key={tpl.id}
                title={tpl.name}
                srcDoc={tpl.html}
                className="mx-auto block h-[760px] w-full max-w-[640px] rounded-lg border border-border bg-white"
              />
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<App />);
