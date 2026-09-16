import * as React from "react";
import { createRoot } from "react-dom/client";
import { Mail, Clock, Users, Tag, FileCode2, FileText, Printer, Sun, Moon } from "lucide-react";
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
import accountDeletionRequestHtml from "./templates/account-deletion-request.html?raw";
import accountDeletedHtml from "./templates/account-deleted.html?raw";
import updatePaymentMethodHtml from "./templates/update-payment-method.html?raw";
import incidentCaseReportHtml from "./templates/incident-case-report.html?raw";

interface Template {
  id: string;
  name: string;
  /**
   * "email" renders in the inbox chrome. "document" is a print/PDF export —
   * previewed page-width with no From line and no scheme toggle, since it only
   * ever renders light on its way to a printer.
   */
  kind: "email" | "document";
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
    kind: "email",
    subject: "Your Accel verification code",
    category: "Account & Authentication",
    priority: "P1",
    whenSent:
      "During account setup (invite → signup) and whenever a user changes their email address.",
    audience: "The individual user verifying their email.",
    mergeTags: ["{{firstName}}", "{{code}}", "{{expiryMinutes}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/otp-verification.html",
    html: otpHtml,
  },
  {
    id: "signin-code",
    name: "Sign-in Verification Code",
    kind: "email",
    subject: "Your Accel sign-in code",
    category: "Account & Authentication",
    priority: "P1",
    whenSent: "At login, when two-factor authentication is enabled.",
    audience: "The user signing in.",
    mergeTags: ["{{firstName}}", "{{code}}", "{{expiryMinutes}}", "{{device}}", "{{location}}", "{{time}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/signin-code.html",
    html: signinCodeHtml,
  },
  {
    id: "password-reset-request",
    name: "Password Reset Request",
    kind: "email",
    subject: "Reset your Accel password",
    category: "Account & Authentication",
    priority: "P1",
    whenSent: "When a user requests a password reset. Delivers a verification code (not a link) to enter.",
    audience: "The user who requested the reset.",
    mergeTags: ["{{firstName}}", "{{code}}", "{{expiryMinutes}}", "{{requestedFrom}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/password-reset-request.html",
    html: passwordResetHtml,
  },
  {
    id: "password-changed",
    name: "Password Changed / Reset Confirmation",
    kind: "email",
    subject: "Your Accel password was changed",
    category: "Account & Authentication",
    priority: "P1",
    whenSent: "After a password is changed — by the user or forced by an admin.",
    audience: "The affected user.",
    mergeTags: ["{{firstName}}", "{{changedAt}}", "{{initiatedBy}}", "{{secureUrl}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/password-changed.html",
    html: passwordChangedHtml,
  },
  {
    id: "2fa-changed",
    name: "Two-Factor Authentication Changed",
    kind: "email",
    subject: "Two-factor authentication was updated",
    category: "Account & Authentication",
    priority: "P2",
    whenSent: "When a user enables or disables 2FA. {{action}} carries \"enabled\" / \"disabled\".",
    audience: "The affected user (and Owner if disabled on a privileged account).",
    mergeTags: ["{{firstName}}", "{{action}}", "{{changedAt}}", "{{email}}", "{{securityUrl}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/2fa-changed.html",
    html: twoFaHtml,
  },
  {
    id: "welcome",
    name: "Welcome / Account Activated",
    kind: "email",
    subject: "Welcome to Accel",
    category: "Team & User Management",
    priority: "P1",
    whenSent: "Once an invited user finishes setup + email verification and their account is active.",
    audience: "The newly activated user.",
    mergeTags: ["{{firstName}}", "{{orgName}}", "{{role}}", "{{siteList}}", "{{dashboardUrl}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/welcome.html",
    html: welcomeHtml,
  },
  {
    id: "invitation",
    name: "User Invitation",
    kind: "email",
    subject: "You've been invited to Accel",
    category: "Team & User Management",
    priority: "P1",
    whenSent: "When an admin invites someone from the User Management panel.",
    audience: "The invited person (not yet a member).",
    mergeTags: ["{{orgName}}", "{{inviteeName}}", "{{siteName}}", "{{acceptUrl}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/invitation.html",
    html: invitationHtml,
  },
  {
    id: "role-changed",
    name: "Role Changed",
    kind: "email",
    subject: "Your role in Accel has been updated",
    category: "Team & User Management",
    priority: "P2",
    whenSent: "When an admin changes a user's role.",
    audience: "The user whose role changed.",
    mergeTags: ["{{firstName}}", "{{orgName}}", "{{previousRole}}", "{{newRole}}", "{{changedBy}}", "{{dashboardUrl}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/role-changed.html",
    html: roleChangedHtml,
  },
  {
    id: "ownership-transfer",
    name: "Ownership Transfer",
    kind: "email",
    subject: "Ownership of your Accel workspace was transferred",
    category: "Team & User Management",
    priority: "P1",
    whenSent: "When workspace ownership is transferred. Sent to both the outgoing and incoming Owner.",
    audience: "Outgoing and incoming Owner.",
    mergeTags: ["{{firstName}}", "{{orgName}}", "{{fromName}}", "{{toName}}", "{{transferredAt}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/ownership-transfer.html",
    html: ownershipHtml,
  },
  {
    id: "account-deletion-request",
    name: "Account Deletion Request",
    kind: "email",
    subject: "Account deletion requested",
    category: "Account & Authentication",
    priority: "P1",
    whenSent:
      "When a member requests account deletion. Sent to the Owner to review, since deletion is role-gated.",
    audience: "The workspace Owner who must action the request.",
    mergeTags: ["{{ownerName}}", "{{orgName}}", "{{requesterName}}", "{{requesterEmail}}", "{{requesterRole}}", "{{requestedAt}}", "{{reviewUrl}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/account-deletion-request.html",
    html: accountDeletionRequestHtml,
  },
  {
    id: "account-deleted",
    name: "Account Deleted",
    kind: "email",
    subject: "Your Accel account has been deleted",
    category: "Account & Authentication",
    priority: "P1",
    whenSent: "After an account is deleted — confirming access and personal data have been removed.",
    audience: "The user whose account was deleted.",
    mergeTags: ["{{firstName}}", "{{orgName}}", "{{email}}", "{{deletedAt}}", "{{deletedBy}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/account-deleted.html",
    html: accountDeletedHtml,
  },
  {
    id: "update-payment-method",
    name: "Update Payment Method",
    kind: "email",
    subject: "Update your payment method",
    category: "Billing & Subscription",
    priority: "P1",
    whenSent:
      "When a subscription charge is declined, or the card on file has expired — before the automatic retry.",
    audience: "The workspace Owner / billing contact.",
    mergeTags: ["{{firstName}}", "{{orgName}}", "{{invoiceId}}", "{{amountDue}}", "{{billingPeriod}}", "{{cardBrand}}", "{{cardLast4}}", "{{declineReason}}", "{{declinedAt}}", "{{retryDate}}", "{{gracePeriodDays}}", "{{billingUrl}}", "{{supportEmail}}", "{{webviewUrl}}"],
    file: "templates/update-payment-method.html",
    html: updatePaymentMethodHtml,
  },
  {
    id: "incident-case-report",
    name: "Incident Case Report",
    kind: "document",
    subject: "CASE-2026-0142 — Incident Case Report",
    category: "Document export",
    priority: "P1",
    whenSent:
      "On demand — Incident Cases → open a case → Export PDF. Opens in a new tab and goes straight to the print dialog.",
    audience: "Whoever is investigating or auditing the case; carries a reviewer sign-off block for the paper trail.",
    mergeTags: [
      "{{caseId}}", "{{caseTitle}}", "{{severity}}", "{{statusLabel}}", "{{siteName}}",
      "{{assigneeName}}", "{{assigneeId}}", "{{openedAt}}", "{{updatedAt}}",
      "{{linkedCount}}", "{{caseNotes}}", "{{severityMix}}", "{{activityCount}}", "{{exportedAt}}",
    ],
    file: "templates/incident-case-report.html",
    html: incidentCaseReportHtml,
  },
];

/**
 * Force a color scheme in the preview iframe. The email itself is driven by the
 * recipient client's `prefers-color-scheme`, which an iframe can't be told to
 * fake — so for the preview we rewrite the media query to always match (dark)
 * or never match (light). The saved template file keeps the real media query.
 */
function applyPreviewScheme(html: string, scheme: "light" | "dark"): string {
  const replacement =
    scheme === "dark"
      ? "@media all and (min-width:0px)"
      : "@media not all";
  return html
    .replace(/@media\s*\(prefers-color-scheme:\s*dark\)/g, replacement)
    .replace(
      /<meta name="color-scheme"[^>]*>/,
      `<meta name="color-scheme" content="${scheme} only" />`
    );
}

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
  const [scheme, setScheme] = React.useState<"light" | "dark">("light");
  const tpl = TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
  const isDoc = tpl.kind === "document";
  // A print document has one palette — only emails get the scheme rewrite.
  const previewHtml = React.useMemo(
    () => (isDoc ? tpl.html : applyPreviewScheme(tpl.html, scheme)),
    [tpl.html, scheme, isDoc]
  );

  /*
   * Size the preview frame to its own content instead of a fixed height, so a
   * long email is fully visible and the page scrolls it — a nested iframe
   * scrollbar hides the footer and is easy to miss entirely. srcDoc is
   * same-origin, so the inner document is measurable; the ResizeObserver picks
   * up late reflows once the webfont lands.
   */
  const frameRef = React.useRef<HTMLIFrameElement | null>(null);
  const [frameHeight, setFrameHeight] = React.useState(900);

  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let observer: ResizeObserver | null = null;

    function measure() {
      const root = frame?.contentDocument?.documentElement;
      if (!root) return;
      setFrameHeight(root.scrollHeight);
      if (!observer) {
        observer = new ResizeObserver(() => {
          const h = frame?.contentDocument?.documentElement?.scrollHeight;
          if (h) setFrameHeight(h);
        });
        observer.observe(root);
      }
    }

    frame.addEventListener("load", measure);
    return () => {
      frame.removeEventListener("load", measure);
      observer?.disconnect();
    };
  }, [previewHtml]);

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
                  Transactional emails and document exports — switch to preview each one.
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

            <InfoRow
              icon={isDoc ? <FileText className="size-3" /> : <Mail className="size-3" />}
              label={isDoc ? "Document title" : "Subject line"}
            >
              {tpl.subject}
            </InfoRow>
            <InfoRow
              icon={<Clock className="size-3" />}
              label={isDoc ? "When it's generated" : "When it's sent"}
            >
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
            <InfoRow icon={<FileCode2 className="size-3" />} label={isDoc ? "Source file" : "Sendable file"}>
              <code className="font-mono text-xs text-muted-foreground">
                PRD_Email_Templates/{tpl.file}
              </code>
            </InfoRow>
          </aside>

          {/* Preview */}
          <main className="overflow-hidden rounded-xl border border-border bg-card">
            {/* Mock mail-client header — a document gets page chrome instead. */}
            <div className="border-b border-border px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{tpl.subject}</p>
                <div className="flex items-center gap-3">
                  {/* Light / dark preview toggle — rewrites the template's
                      prefers-color-scheme query so both palettes are viewable.
                      A print document has one palette, so it is hidden there. */}
                  {!isDoc && (
                    <div className="flex items-center rounded-md border border-border p-0.5">
                      {(["light", "dark"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setScheme(s)}
                          className={cn(
                            "flex items-center gap-1 rounded px-2 py-1 text-2xs font-semibold capitalize transition-colors",
                            scheme === s
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {s === "light" ? <Sun className="size-3" /> : <Moon className="size-3" />}
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                    {isDoc && <Printer className="size-3" />}
                    {isDoc ? "Print preview · A4" : "Inbox preview"}
                  </span>
                </div>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isDoc ? (
                  <>Generated by <span className="text-foreground">Accel TRMS</span> · opens in the browser print dialog</>
                ) : (
                  <>From <span className="text-foreground">Accel &lt;no-reply@accel.com&gt;</span></>
                )}
              </p>
            </div>
            <div
              className={cn(
                "p-4 sm:p-8",
                isDoc ? "bg-[#d8d7d4]" : scheme === "dark" ? "bg-[#0b0b0b]" : "bg-[#e9e8e5]"
              )}
            >
              <iframe
                ref={frameRef}
                key={`${tpl.id}-${scheme}`}
                title={tpl.name}
                srcDoc={previewHtml}
                scrolling="no"
                style={{ height: frameHeight }}
                className={cn(
                  "mx-auto block w-full border border-border",
                  // A4 content width at 96dpi, so the preview breaks lines where paper will.
                  isDoc ? "max-w-[794px] bg-white shadow-lg" : "max-w-[640px] rounded-lg"
                )}
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
