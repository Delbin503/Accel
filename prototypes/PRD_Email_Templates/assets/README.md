# Email image assets

Drop the brand images here, then tell Claude and the templates get pointed at
them.

| File | Size | Used by | Required? |
|---|---|---|---|
| `auth-bg-tile.gif` | 240×240, 20 frames, ~65KB | every template — the brand panel texture | No — flat `#F1F0EE` is the fallback |
| `auth-bg-tile.png` | 240×240, ~1.3KB | static twin of the GIF — same tile, no motion | No — same flat fallback |

## Two ways to wire them up

**Preview only** — files sit here, Claude inlines them as base64 data URIs so the
prototype gallery renders. Fast, but *not* sendable: Gmail and Outlook both block
`data:` URIs on `<img>`.

**Production** — upload to a CDN and give Claude the absolute `https://` URLs.
Email cannot use relative paths, so this is required before anything ships.

## `auth-bg-tile.gif` — the brand panel texture

Generated, not hand-drawn. It mirrors the login page's survey grid and orange
scan sweep, retuned for the light email palette, and loops in **both** axes so it
can `background-repeat` over any area without a seam.

Since the Figma redesign (node `5809:211284`) this tile is the texture behind the
**brand panel** — the 200px-tall rounded card that sits above the sign-off in
every template, with the Accel wordmark centred on it. It is no longer the page
backdrop; the page behind the email card is now a flat `#F2F1EF`.

Worth knowing: the panel texture in the Figma frame is byte-identical to this
file — the designer imported it from this repo. Figma layers it over a
brown→orange gradient, but the tile is opaque so the gradient never shows; the
templates drop the gradient and keep the tile.

Where it renders:

| Client | Result |
|---|---|
| Apple Mail, iOS Mail | Animates |
| Gmail (app + web) | Animates |
| Outlook Windows | `background-image` is dropped entirely → flat `#F1F0EE` |
| Images blocked | Flat `#F1F0EE` |
| Dark mode | Suppressed (`background-image:none`) → flat `#201C1A` |

CSS animation does not exist in email, so an animated GIF is the only motion
that survives; nothing in the design depends on it moving. With the tile missing
the panel still reads correctly — a soft grey card with the wordmark on it.

**Before sending:** upload to the CDN as
`https://cdn.accel.com/email/auth-bg-tile.gif` — that exact URL is already
referenced by every template. Until then it 404s and recipients see the flat
fallback.

### `auth-bg-tile.png` — the static twin

Identical pixels to the GIF's first frame, so the two are interchangeable with
no visual jump. It tiles the same way and is only 1.3KB.

Use it for design tooling (Figma, mockups), or swap the templates over to a
still texture by replacing `auth-bg-tile.gif` with `auth-bg-tile.png` — the
markup is otherwise unchanged:

```
grep -rl 'auth-bg-tile.gif' templates/ | xargs sed -i '' 's/auth-bg-tile\.gif/auth-bg-tile.png/g'
```

Upload it alongside the GIF as `https://cdn.accel.com/email/auth-bg-tile.png`.

## Retired assets

`hero-device.png` and `hero-circuit.png` were only ever used by the old
`invitation-light.html` hero band. That band was removed when every template
adopted the shared Figma shell, so neither file is referenced any more and
neither needs to be produced.
