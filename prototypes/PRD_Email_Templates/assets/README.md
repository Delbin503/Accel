# Email image assets

Drop the brand hero images here, then tell Claude and the templates get pointed
at them.

| File | Size | Used by | Required? |
|---|---|---|---|
| `hero-device.png` | 584×392 (serves at 292px) | `invitation-light.html` brand band | Yes |
| `hero-circuit.png` | 600px wide | `invitation-light.html` band texture | No — flat orange is a fine fallback |

## Two ways to wire them up

**Preview only** — files sit here, Claude inlines them as base64 data URIs so the
prototype gallery renders. Fast, but *not* sendable: Gmail and Outlook both block
`data:` URIs on `<img>`.

**Production** — upload to a CDN and give Claude the absolute `https://` URLs.
Email cannot use relative paths, so this is required before anything ships.

## If no device shot is available

The band is built so the image is optional: with it missing or blocked, the
orange field, logo, headline and subcopy still render, and the alt text is styled
white so it reads against the orange. It degrades, it doesn't break.
