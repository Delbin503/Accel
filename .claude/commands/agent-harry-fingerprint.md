---
description: Create or refresh the project's `product-fingerprint.md` — the project-level visual + composition vocabulary that lo-fi-designer, figma-designer, and design-engineer read at intake. Invokes the product-fingerprint-curator agent. Use `--refresh` to re-curate after the product evolves.
argument-hint: "[--refresh]"
---

# /agent-harry-fingerprint

Curate (or refresh) the project's **product fingerprint** — a project-level artifact at `<project-root>/product-fingerprint.md` that captures the existing product's visual language and composition patterns from 3–7 designer-picked "exciting" Figma frames.

The fingerprint is read by `lo-fi-designer`, `figma-designer`, and `design-engineer` at intake so new feature work matches the product's actual norms — not just DS tokens, not generic best practices.

## What this command does

1. Detect whether `<project-root>/product-fingerprint.md` already exists.
2. Pick the right mode for the curator:
   - **Mode A (first curation)** — no fingerprint exists, or invoked without `--refresh`
   - **Mode B (refresh)** — fingerprint exists AND `--refresh` flag is present
3. Invoke the `product-fingerprint-curator` agent with the appropriate mode.
4. The curator handles intake, pulls 3–7 Figma frames via `mcp__figma`, synthesizes the fingerprint, writes the file, and presents a Stop Gate for user approval.

## Argument parsing

| Invocation | Mode |
|---|---|
| `/agent-harry-fingerprint` | Mode A (first curation) — refuses if fingerprint already exists, suggests `--refresh` |
| `/agent-harry-fingerprint --refresh` | Mode B (refresh) — refuses if no fingerprint exists, suggests dropping the flag |

## Steps to execute

1. Parse `$ARGUMENTS` for `--refresh`.
2. Check existence of `<project-root>/product-fingerprint.md` via Glob.
3. Apply the routing matrix:
   - **No fingerprint + no `--refresh`** → invoke `product-fingerprint-curator` in Mode A
   - **No fingerprint + `--refresh` given** → refuse with: *"No existing fingerprint to refresh. Drop the `--refresh` flag to do a first curation, or check if you meant a different project."*
   - **Fingerprint exists + no `--refresh`** → refuse with: *"`product-fingerprint.md` already exists. Add `--refresh` to re-curate, or remove the file manually if you want to start clean."* (Note: do NOT auto-delete; the user must explicitly confirm.)
   - **Fingerprint exists + `--refresh` given** → invoke `product-fingerprint-curator` in Mode B
4. Wait for the curator's Stop Gate output. Relay the user's decision back to the curator (`y` / `revise <delta>` / `cancel`).

## When to invoke this command

- **First feature being designed in this project** — the orchestrator will auto-prompt fingerprint creation at the Define→Deliver boundary; this command is the manual equivalent
- **Pre-intake refusal escalation** — a Deliver agent refused to run because the fingerprint is missing; the user types `run product-fingerprint-curator now` or invokes this command
- **Product visibly evolved** — rebrand, redesign, new hero work shipped, DS major version bump → run with `--refresh`
- **Stale-detection nudge** — a Deliver agent's pre-intake check found stale references (`lastModified` newer than curation timestamp); user opts to refresh before proceeding → run with `--refresh`
- **Sanity check** — designer eyeballs the fingerprint and feels it no longer represents the product → run with `--refresh`

## Hard rules

- Do NOT overwrite an existing fingerprint without `--refresh` AND user confirmation.
- Do NOT invoke the curator if `mcp__figma` is not available — let the curator's own Question 1 handle that refusal.
- Do NOT auto-delete the existing fingerprint before refresh; the curator preserves entries the user keeps.
- This command is cheap (~$0 — just invokes the curator); the cost lands inside the curator's run.

## Cost expectation

- First curation: ~$0.50 (3–7 Figma frames pulled + synthesis + Stop Gate)
- Refresh with mostly-unchanged refs: ~$0.20
- Refresh with all refs replaced: ~$0.50 (effectively a fresh curation)

## After the curator completes

The user types `y` at the Stop Gate. The fingerprint file is locked in. From the next `lo-fi-designer` / `figma-designer` / `design-engineer` invocation onward, those agents:

1. Run their pre-intake fingerprint check
2. Load the fingerprint into intake context
3. Apply visual language + composition patterns + anti-patterns to their output

No further command is needed. The fingerprint persists at the project root and is read on every future invocation.
