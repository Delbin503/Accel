# Email image assets

Drop the brand hero images here, then tell Claude and the templates get pointed
at them.

| File | Size | Used by | Required? |
|---|---|---|---|
| `hero-device.png` | 584×392 (serves at 292px) | `invitation-light.html` brand band | Yes |
| `hero-circuit.png` | 600px wide | `invitation-light.html` band texture | No — flat orange is a fine fallback |
| `auth-bg-tile.gif` | 240×240, 20 frames, ~65KB | every template — animated light-mode page backdrop | No — flat `#F2F1EF` is the fallback |
| `auth-bg-tile.png` | 240×240, ~1.3KB | static twin of the GIF — same tile, no motion | No — same flat fallback |

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


## `auth-bg-tile.gif` — the animated backdrop

Generated, not hand-drawn. It mirrors the login page's survey grid and orange
scan sweep, retuned for the light email palette, and loops in **both** axes so it
can `background-repeat` over an email of any height without a seam.

Where it renders:

| Client | Result |
|---|---|
| Apple Mail, iOS Mail | Animates |
| Gmail (app + web) | Animates |
| Outlook Windows | `background-image` is dropped entirely → flat `#F2F1EF` |
| Images blocked | Flat `#F2F1EF` |
| Dark mode | Suppressed (`background-image:none`) — the tile is tuned for light |

CSS animation does not exist in email, so an animated GIF is the only motion
that survives; nothing in the design depends on it moving.

**Before sending:** upload to the CDN as
`https://cdn.accel.com/email/auth-bg-tile.gif` — that exact URL is already
referenced by every template. Until then it 404s and recipients see the flat
fallback.

### `auth-bg-tile.png` — the static twin

Identical pixels to the GIF's first frame, so the two are interchangeable with
no visual jump. It tiles the same way and is only 1.3KB.

Use it for design tooling (Figma, mockups), or swap the templates over to a
still backdrop by replacing `auth-bg-tile.gif` with `auth-bg-tile.png` — the
markup is otherwise unchanged:

```
grep -rl 'auth-bg-tile.gif' templates/ | xargs sed -i '' 's/auth-bg-tile\.gif/auth-bg-tile.png/g'
```

Upload it alongside the GIF as `https://cdn.accel.com/email/auth-bg-tile.png`.
