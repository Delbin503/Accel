/**
 * Token data for the Storybook Token Reference, generated at build time from
 * the real src/index.css (Vite `?raw` import) — the reference can never drift
 * from the code. Parsing lives in tokenParser.ts.
 */
import css from "../styles.css?raw";
import { parseTokens } from "./tokenParser";

export * from "./tokenParser";

export const tokenData = parseTokens(css);
