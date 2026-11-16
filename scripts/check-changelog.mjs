#!/usr/bin/env node
/**
 * Changelog guard for the design-system package — run on pull requests.
 *
 *   node scripts/check-changelog.mjs [base-ref]
 *
 * If anything under packages/ui/ changed against the base (default: the PR's
 * target branch from BITBUCKET_PR_DESTINATION_BRANCH, else "main"), then
 * packages/ui/CHANGELOG.md must have at least one entry under
 * "## [Unreleased]" — or the PR must be a release (package.json version
 * changed). Uncommitted and untracked files count, so it also works locally.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PKG = "packages/ui/";
const CHANGELOG = "packages/ui/CHANGELOG.md";
const target = process.env.BITBUCKET_PR_DESTINATION_BRANCH;
const base = process.argv[2] ?? (target ? `origin/${target}` : "main");

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const lines = (s) => s.split("\n").filter(Boolean);

let changed;
try {
  const mergeBase = git("merge-base", base, "HEAD");
  changed = new Set([
    ...lines(git("diff", "--name-only", mergeBase, "--", PKG)),
    ...lines(git("ls-files", "--others", "--exclude-standard", "--", PKG)),
  ]);
} catch (e) {
  console.error(`Changelog check: can't diff against "${base}" (${String(e.message).split("\n")[0]}). Fetch the base branch first.`);
  process.exit(2);
}

const relevant = [...changed].filter((f) => f !== CHANGELOG);
if (relevant.length === 0) {
  console.log("Changelog check passed — no changes in packages/ui.");
  process.exit(0);
}

const text = readFileSync(CHANGELOG, "utf8");
const unreleased = text.split(/^## \[Unreleased\]\s*$/m)[1]?.split(/^## \[/m)[0] ?? "";
const hasEntry = /^\s*[-*] \S/m.test(unreleased);

let versionBumped = false;
try {
  const before = JSON.parse(git("show", `${git("merge-base", base, "HEAD")}:packages/ui/package.json`)).version;
  const now = JSON.parse(readFileSync("packages/ui/package.json", "utf8")).version;
  versionBumped = before !== now;
} catch {
  versionBumped = true; // the package doesn't exist on the base yet — this PR is its first release
}

if (hasEntry || versionBumped) {
  console.log(`Changelog check passed — ${relevant.length} file(s) changed in packages/ui, ${hasEntry ? "Unreleased has entries" : "version bumped (release)"}.`);
  process.exit(0);
}
console.error(`Changelog check failed — ${relevant.length} file(s) changed in packages/ui, but ${CHANGELOG} has nothing under "## [Unreleased]".

Add a line saying what changed for people using the components, e.g.
  - DataTable: \`stickyHeader\` now also pins the selection column.
Semver guide: packages/ui/README.md#versioning.`);
process.exit(1);
