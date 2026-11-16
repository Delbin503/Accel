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
 * - `@/…` → the app (src/). Design-system code is only reachable through
 *   `@accel/ui`; the old `@/components/ui|shared|…` paths were removed.
 */
export const aliases = [
  { find: /^@accel\/ui$/, replacement: path.join(ui, "index.ts") },
  { find: /^@accel\/ui\//, replacement: `${ui}/` },
  { find: /^@\//, replacement: `${path.join(root, "src")}/` },
];
