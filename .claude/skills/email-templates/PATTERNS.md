# Patterns & Client Quirks

## Client behavior you must design around

| Client | Engine | What breaks |
|---|---|---|
| Outlook 2016–2021, Windows | Word | No flex/grid, no `border-radius`, no `background-image`, no `max-width`, drops `margin:auto`, ignores `padding` on `<a>` |
| Outlook.com / Outlook mobile | Proprietary | Force-inverts dark mode, rewrites some colors |
| Gmail web | WebKit + sanitizer | Strips `<head>` styles when the message is forwarded or fetched over POP; clips the message past ~102KB |
| Gmail Android | WebKit | Bumps text under 14px up, breaking fixed-width layouts |
| Apple Mail / iOS | WebKit | Best support; honors `prefers-color-scheme`; auto-links dates, addresses, phone numbers |
| Yahoo / AOL | Sanitizer | Strips `<style>` in `<body>`; no CSS variables |

Two consequences worth internalizing: **inline everything that matters**, and
**assume the 102KB clip** — keep the whole HTML under ~90KB or Gmail truncates
the footer and appends a "View entire message" link.

## Dark mode

Three tiers, and you need all three because clients disagree:

1. **Honoring clients** (Apple Mail, iOS, Outlook macOS) — read your
   `@media (prefers-color-scheme: dark)` block. You control the result.
2. **Force-inverting clients** (Outlook.com, Gmail on some Android builds) —
   ignore your media query and algorithmically invert colors. You do not
   control the result; you only control how badly it degrades.
3. **No dark mode** — light rendering, always.

Declare support so honoring clients opt in:

```html
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media (prefers-color-scheme: dark) {
    .email-bg   { background-color: #121212 !important; }
    .email-card { background-color: #171717 !important; }
    .t-body     { color: #f2f2f2 !important; }
    .t-muted    { color: #999999 !important; }
    .hairline   { border-color: #262626 !important; }
  }
</style>
```

Survive tier 2 by never depending on pure `#ffffff` or `#000000` — inversion
turns them into the harshest possible opposite. Logos must be PNGs with a
transparent background and a mid-tone mark, never black-on-white. And never
place light text on a colored `<td>` background that inversion might lighten.

## Bulletproof button

`padding` on `<a>` is ignored by Outlook, so the padding lives on the `<td>` and
the `<a>` is a block filling it. The VML block gives Outlook a real rounded,
filled rectangle.

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" bgcolor="#f9681f" style="border-radius:6px; border:1px solid #ef5406;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{URL}}"
        style="height:44px;v-text-anchor:middle;width:220px;" arcsize="14%"
        stroke="f" fillcolor="#f9681f">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">{{LABEL}}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="{{URL}}" style="display:inline-block; padding:13px 28px; font-family:'Manrope',Arial,sans-serif; font-size:16px; line-height:18px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:6px;">{{LABEL}}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>
```

Keep the button orange in dark mode — `#f9681f` reads fine on both. Do not add a
dark-mode override for it.

## Severity badge

Word plus swatch, never swatch alone.

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td bgcolor="#ef4343" style="border-radius:4px; padding:5px 10px; font-family:'Manrope',Arial,sans-serif; font-size:12px; line-height:14px; font-weight:700; color:#ffffff; text-transform:uppercase; letter-spacing:0.4px;">
      Critical
    </td>
  </tr>
</table>
```

Swap `bgcolor` and text color per the severity table in [TOKENS.md](TOKENS.md).
Medium (`#faa805`) takes `#1a1a1a` text, not white.

## Key–value detail block

The workhorse for alerts, receipts, and audit notices. Two columns, fixed label
width, hairline between rows.

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td width="140" class="t-muted hairline" style="padding:12px 0; border-bottom:1px solid #d9d9d9; font-family:'Manrope',Arial,sans-serif; font-size:14px; line-height:20px; color:#666666;">Site</td>
    <td class="t-body hairline" style="padding:12px 0; border-bottom:1px solid #d9d9d9; font-family:'Manrope',Arial,sans-serif; font-size:14px; line-height:20px; color:#1a1a1a; font-weight:600;">{{SITE_NAME}}</td>
  </tr>
  <!-- repeat rows; drop border-bottom on the last -->
</table>
```

On narrow screens these two columns still fit at 140 + ~300px. Do not add a
third column — stack instead.

## Callout panel

For expiry warnings, quota notices, "action required" context.

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td class="panel" bgcolor="#feeee6" style="border-radius:6px; padding:16px; font-family:'Manrope',Arial,sans-serif; font-size:14px; line-height:20px; color:#8a380f;">
      This link expires in 30 minutes.
    </td>
  </tr>
</table>
```

Dark override: `.panel { background-color:#371606 !important; color:#fcab83 !important; }`

## Preheader

The grey text next to the subject in the inbox list. If you omit it, clients
scrape your first visible line — usually "View in browser". Always set it.

```html
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#f7f7f7; opacity:0;">
  {{PREHEADER}}
  &#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;
</div>
```

The zero-width spaces pad it out so no body text leaks into the preview.

## Responsive

One media query, one breakpoint. Mobile-first fluid tables plus this:

```html
@media only screen and (max-width:600px) {
  .container { width:100% !important; }
  .stack     { display:block !important; width:100% !important; }
  .px        { padding-left:20px !important; padding-right:20px !important; }
  .hide-sm   { display:none !important; }
}
```

Outlook Windows ignores media queries entirely — which is fine, it is a desktop
client at full width. Never hide anything essential behind `.hide-sm`'s inverse.

## Plain-text twin

Same links, same facts, no markup. 72-column wrap.

```
CRITICAL DETECTION - Warehouse B / Camera 04

Detected:  Unauthorized entry
Site:      Warehouse B
Camera:    CAM-04 (Loading Dock)
Time:      2026-08-06 14:32 UTC+07
Severity:  Critical

View the incident:
https://app.example.com/incidents/inc_8f21c

--
Accel TRMS
Notification preferences: https://app.example.com/settings/notifications
```

## Testing before you ship

`check-email.mjs` catches structural mistakes, not rendering. For rendering, the
honest minimum is: Gmail web, Gmail Android, Apple Mail iOS dark, Outlook Windows.
Send yourself a real message — an in-browser preview will not show you the Word
engine's failures, which are the ones that actually bite.
