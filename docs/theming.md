# Re-skinning the design system for another brand

The Accel design system is themed entirely through CSS variables in `packages/ui/src/styles.css` (`@accel/ui/styles.css`). Components only use **semantic** tokens (`bg-primary-fill`, `text-primary-ink`, `ring-ring`…), and every brand-coloured semantic token is derived from **one primitive ramp**. So a new brand is a small stylesheet, not a fork.

## What a product overrides

Put the overrides in a stylesheet loaded **after** `index.css`, on **`:root`** (and `.dark` where noted).

| Override | Tokens | Drives |
|---|---|---|
| **Brand ramp** (required) | `--palette-orange-50, -300, -500, -600, -700, -800, -950` | `--primary`, `--primary-fill`, `--primary-hover`, `--primary-active`, `--primary-ink`, `--accent`, `--accent-foreground`, `--ring`, `--chart-1`, `--sidebar-primary`, focus rings, selected states, brand tints |
| Fonts (optional) | `--font-sans`, `--font-mono` (in `@theme`; override on `:root`) | All text; load the font files yourself |
| Corner radius (optional) | `--radius` | Every `rounded-*` derived from it |
| Neutrals (rarely) | `--palette-neutral-*` | Surfaces, borders, muted text. Changing these affects contrast everywhere — re-run the a11y gate |

The ramp keeps its `orange` name: it is the **brand** slot. Renaming it would touch every token and isn't worth it.

### Why `:root` and not a wrapper element

Semantic tokens are declared on `:root` (`--primary-fill: var(--palette-orange-600)`), so CSS resolves them there. Overriding a palette variable on a child `<div>` changes nothing below it. To theme only part of a page, re-declare the **semantic** tokens on that element instead.

## Contrast rules for the ramp (WCAG AA)

Each step has a job. Check the new colours against these before shipping:

| Step | Used as | Must reach |
|---|---|---|
| `600` | Solid fills **under white labels** (`bg-primary-fill`) | 4.5:1 against white |
| `700` | Brand **text on light surfaces** (`text-primary-ink`, light theme) and fill hover | 4.5:1 on white **and** on its own `/10` tint |
| `500` | Brand text on dark surfaces (`text-primary-ink`, dark theme), rings, dots, charts | 4.5:1 on the dark card (`--palette-neutral-910`) |
| `800` | Pressed fill; accent text in light | 4.5:1 on `50` |
| `300` on `950` | Accent text / tint in dark | 4.5:1 |
| `50` | Light accent tint (hover / selected backgrounds) | — |

Then run `npm run test:a11y`: it checks every story in light and dark.

## Example — a teal brand

Verified on the prototypes (2026-11-16): buttons, the active nav item, avatars, KPI dots and focus rings all switch.

```css
/* brand.css — import after @accel/ui/styles.css */
:root {
  --palette-orange-50:  hsl(175 60% 95%);
  --palette-orange-300: hsl(175 60% 70%);
  --palette-orange-500: hsl(175 70% 45%);
  --palette-orange-600: hsl(175 75% 28%);
  --palette-orange-700: hsl(175 80% 24%);
  --palette-orange-800: hsl(175 70% 20%);
  --palette-orange-950: hsl(175 60% 10%);

  /* optional */
  --font-sans: "Inter", sans-serif;
  --radius: 0.375rem;
}
```

## Brand artwork

The logo mark and the token coin read their colours from component tokens, so a re-skin can swap them too:

| Token | Used by | Default |
|---|---|---|
| `--brand-mark` | Sidebar logo mark (`fill-brand-mark`) | the Accel logo orange `#FE5C01` (`--palette-orange-550`) |
| `--brand-coin` | Token coin face (`fill-brand-coin`) | `--palette-orange-450` |
| `--brand-coin-ink` | Token coin outline and mark | `--palette-neutral-960` |

Override them on `:root` next to the brand ramp. Logo **image files** (`src/assets/*.svg`, the Sigmawave partner logo) can't read CSS variables; replace those files instead.

## What does not re-skin

- **Logo image files** (`src/assets/*.svg`) and partner logos use their own colours. Swap the files.
- **Status and severity colours** (`--success`, `--severity-*`…) are semantic, not brand — keep them so alerts read the same in every product.
- **Media surfaces** (`--media*`, `--scrim`) stay dark in both themes on purpose (video and floor plans).
- **Email / PDF HTML** uses the paper palette in `src/lib/tokens.ts`, which can't read CSS variables — update it by hand.
