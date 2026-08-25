# Email Tokens

Hex conversions of the real values in [src/index.css](../../../src/index.css).
Regenerate these if the stylesheet's HSL values change — they are a snapshot,
not a live binding.

## Palette — light

| Role | CSS token | Hex | Use in email |
|---|---|---|---|
| Page background | `--background` | `#f7f7f7` | Outer `<body>` and wrapper table |
| Card surface | `--card` | `#ffffff` | Inner 600px content table |
| Body text | `--foreground` | `#1a1a1a` | Paragraphs, headings |
| Secondary text | `--muted-foreground` | `#666666` | Meta lines, footer, timestamps |
| Muted fill | `--muted` | `#ebebeb` | Table header rows, code blocks |
| Border | `--border` | `#d9d9d9` | Hairlines, table cell borders |
| Brand / CTA | `--primary` | `#f9681f` | Button background, links |
| Brand pressed | `--primary-hover` | `#ef5406` | Button border (adds depth in Outlook) |
| Brand tint | `--accent` | `#feeee6` | Callout panel background |
| On brand tint | `--accent-foreground` | `#8a380f` | Text on `#feeee6` |
| CTA text | `--primary-foreground` | `#ffffff` | Text on the orange button |
| Danger | `--destructive` | `#ef4343` | Failure notices |

## Palette — dark

Only reachable via `@media (prefers-color-scheme: dark)`. Apple Mail, iOS Mail
and Outlook macOS honor it. Gmail and Outlook.com **force-invert instead** — see
the dark-mode section of [PATTERNS.md](PATTERNS.md).

| Role | Hex |
|---|---|
| Page background | `#121212` |
| Card surface | `#171717` |
| Body text | `#f2f2f2` |
| Secondary text | `#999999` |
| Muted fill | `#212121` |
| Border | `#262626` |
| Brand / CTA | `#f9681f` (unchanged) |
| Brand tint | `#371606` |
| On brand tint | `#fcab83` |
| Danger | `#dd3c3c` |

## Severity — identical in both schemes

| Severity | Hex | Badge text on it |
|---|---|---|
| Critical | `#ef4343` | `#ffffff` |
| High | `#f96c1f` | `#ffffff` |
| Medium | `#faa805` | `#1a1a1a` |
| Low | `#408df2` | `#ffffff` |
| Success / resolved | `#22c35d` | `#ffffff` |
| Warning | `#faa805` | `#1a1a1a` |

Severity must never be carried by color alone — always pair the swatch with the
word. Colorblind readers, forced-dark inversion, and plain-text all depend on it.

## Type scale

**This is not the dashboard scale.** The app's 9–13px dense scale exists for a
desktop control surface. Email is read on a phone, often outdoors, and Gmail on
Android bumps anything under 14px anyway — which breaks your layout rather than
helping. Use these instead:

| Purpose | Size | Line height | Weight |
|---|---|---|---|
| Hero number / amount | 32px | 40px | 700 |
| H1 — email title | 24px | 32px | 700 |
| H2 — section header | 18px | 26px | 600 |
| Body | 16px | 24px | 400 |
| Compact body, table cells | 14px | 20px | 400 |
| Meta, footer, legal | 12px | 18px | 400 |

Never go below 12px. Never rely on `rem`/`em` — Outlook resolves them
unpredictably. Always set `line-height` in px alongside `font-size`.

## Font stack

Manrope is a webfont and will not load in Outlook, Gmail, or Yahoo. Always ship
the full fallback chain so the layout holds when it drops:

```
font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```

For monospace values (device IDs, hashes):

```
font-family: 'JetBrains Mono', SFMono-Regular, Consolas, 'Liberation Mono', monospace;
```

## Spacing and shape

Padding on table cells only — `margin` is unreliable, and Outlook drops
`margin: auto` entirely.

| Step | px | Use |
|---|---|---|
| Tight | 8 | Inside badges, between stacked meta lines |
| Base | 16 | Between paragraphs, table cell padding |
| Section | 24 | Between content blocks |
| Block | 32 | Above/below the CTA, card top/bottom padding |
| Frame | 40 | Header and footer breathing room |

- Content width: **600px**, `width="100%"` with `max-width:600px` on the table.
- Border radius: **6px** (`--radius` 0.5rem ≈ 8px, rounded down for email).
  Outlook ignores it and renders square — that is acceptable, so never let a
  design depend on the curve to be legible.
