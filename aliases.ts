import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const ui = path.join(root, "packages/ui/src");

/**
 * Module aliases shared by the app, the prototypes, Storybook and Vitest.
 * Order matters: specific entries first, the app's "@" last.
 *
 * - `@accel/ui` → the design-system package source (packages/ui). The bare
 *   specifier is the barrel; `@accel/ui/components/ui/button` etc. are deep
 *   imports.
 * - Compatibility: the old `@/components/ui|shared|charts|custom|layout`,
 *   `@/lib/utils|formatters|tokens|dialCodes|playback` and `@/hooks/use-mobile`
 *   paths still resolve to the package, for files not yet moved over
 *   (uncommitted work, frozen legacy copies). New code imports `@accel/ui`.
 */
export const aliases = [
  { find: /^@accel\/ui$/, replacement: path.join(ui, "index.ts") },
  { find: /^@accel\/ui\//, replacement: `${ui}/` },
  // One entry per path: Vite 8 (Rolldown) aliases don't substitute $1.
  ...(["ui", "shared", "charts", "custom", "layout"] as const).map((dir) => ({
    find: new RegExp(`^@/components/${dir}(?=/|$)`),
    replacement: `${ui}/components/${dir}`,
  })),
  ...(["utils", "formatters", "tokens", "dialCodes", "playback"] as const).map((file) => ({
    find: new RegExp(`^@/lib/${file}$`),
    replacement: `${ui}/lib/${file}`,
  })),
  { find: /^@\/hooks\/use-mobile$/, replacement: `${ui}/hooks/use-mobile` },
  { find: /^@\//, replacement: `${path.join(root, "src")}/` },
];
