---
name: email-templates
description: Build transactional HTML emails for this dashboard — detection alerts, user invites, billing receipts, password resets, digests. Produces email-safe table-based HTML with inlined design tokens, dark-mode handling, Outlook fallbacks, and a plain-text alternative. Use when writing or editing any outbound email, .html email template, notification email copy, or when the user mentions transactional email, email template, alert email, invite email, receipt email, or email client rendering.
---

# Transactional Email Templates

Email HTML is not web HTML. Outlook on Windows renders through Word — no flexbox,
no grid, no `border-radius`, no `background-image`. Gmail strips much of `<head>`.
So this skill deliberately breaks the app's own rules: **tables for layout, inline
styles, literal hex, larger type**. Do not import from `src/` or use Tailwind here.

## Quick start

1. Copy [templates/base.html](templates/base.html) — the 600px shell, already
   wired with preheader, dark-mode meta, and footer.
2. Drop in the components you need from [PATTERNS.md](PATTERNS.md)
   (button, severity badge, data table, KPI row, divider).
3. Use the hex values in [TOKENS.md](TOKENS.md). Never `var(--primary)` —
   CSS variables do not resolve in most email clients.
4. Write the matching `.txt` plain-text version. Not optional; it drives
   deliverability and is what watches/screen readers often get.
5. Validate: `node .claude/skills/email-templates/scripts/check-email.mjs <file>`

## Workflow

- [ ] Identify the trigger event and the single action you want taken
- [ ] Subject line ≤ 45 chars, front-loaded; preheader ≤ 90 chars, not a repeat
- [ ] Build from `base.html`; one primary CTA, above the fold
- [ ] All content readable with images blocked — never put facts in an image
- [ ] Inline every style; `<style>` only for media queries and dark mode
- [ ] Verify light and dark, then narrow viewport (320px)
- [ ] Write `.txt` twin with the same links
- [ ] Run `check-email.mjs`; fix every error, judge each warning

## Hard rules

| Rule | Why |
|---|---|
| `<table role="presentation">` for all layout | Outlook/Word has no flex or grid |
| Inline `style=""` on every element | Gmail strips `<head>` in forwarded/POP views |
| Literal hex, never CSS variables | Variables do not cascade in Outlook, Yahoo, older iOS |
| Body text ≥ 14px, never below 12px | The 9–13px dashboard scale is unreadable on phones |
| Absolute `https://` image URLs + `alt` + `width`/`height` | Relative paths break; images are blocked by default |
| 600px max content width | The safe ceiling across Outlook's preview pane |
| No `<script>`, no forms, no external CSS `<link>` | Stripped or flagged as phishing |
| Fixed padding — no `margin: auto` centering | Outlook drops auto margins |

## Content rules for this product

- **Detection alerts** — lead with severity + site + camera + timestamp in the
  subject. Deep-link to the incident, never to a bare dashboard root.
- **Never embed** OTP codes, session tokens, or API keys in a query string.
  One-time links only, with the expiry stated in the body.
- **Timestamps** — absolute, with an explicit timezone (`14:32 UTC+07`).
  Relative time ("2 minutes ago") is a lie by the time the mail is opened.
- **Billing** — amount, currency, and period in the body text, not only a PDF.
- Transactional mail is exempt from unsubscribe, but keep the notification
  preferences link in the footer. Digests and marketing need real unsubscribe.

## Reference

- [TOKENS.md](TOKENS.md) — hex palette, email type scale, spacing, severity colors
- [PATTERNS.md](PATTERNS.md) — component snippets, client quirks, dark-mode strategy
- [templates/base.html](templates/base.html) — the shell to start from
- [templates/detection-alert.html](templates/detection-alert.html) — worked example
- `scripts/check-email.mjs` — lints a template for the hard rules above
