import { appendFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/*
 * Measures how much reviewable source a pull request changes, so review spend
 * stops scaling with diff size (#831). The thresholds below are derived from
 * this repository's own review-round data rather than picked: #826 shipped in
 * six bot rounds at 242 gated lines, while #814 at 458 produced 34 review
 * threads across eight. The gate measures its own diff like any other, so a
 * change to either number is itself reviewable - which is the property
 * `max-lines` lacked when it ratcheted 343 to 517 to 520 inside feature
 * commits. The escape hatch is deliberately not a number here: it is the
 * `size-exception` label, which a reviewer can see was applied.
 */
export const WARNING_THRESHOLD = 250;
export const FAILURE_THRESHOLD = 400;

export const EXCEPTION_LABEL = "size-exception";

export const REPORT_MARKER = "<!-- pr-size-gate -->";

/*
 * Excluded because gating them would penalise exactly what other gates here
 * demand. Jest enforces 100% coverage, so tests run at roughly twice the
 * source by construction, and the contribution rules require capturing
 * durable learnings in Markdown in the same pull request. A lockfile is
 * generated, so counting one would fire the gate on every Dependabot pull
 * request and teach everyone to ignore it - #813 is 4,867 raw lines and 66
 * without `package-lock.json`.
 */
const LOCKFILE_NAMES = new Set([
  "npm-shrinkwrap.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
]);

const E2E_PREFIX = "tests-e2e/";

const BUCKET_LABELS = {
  e2e: "End-to-end specs and snapshots",
  lockfile: "Lockfiles",
  markdown: "Markdown",
  source: "Source (gated)",
  story: "Storybook stories",
  test: "Tests",
};

const BUCKET_ORDER = ["source", "test", "story", "e2e", "markdown", "lockfile"];

/*
 * `tests-e2e/` is checked before the test-name pattern because its specs are
 * named `*.spec.ts` and would otherwise land in the test bucket; the two are
 * reported separately so a reader can see which kind of test grew.
 */
export function classifyPath(filePath) {
  const basename = filePath.slice(filePath.lastIndexOf("/") + 1);

  if (LOCKFILE_NAMES.has(basename)) {
    return "lockfile";
  }
  if (basename.endsWith(".md")) {
    return "markdown";
  }
  if (filePath.startsWith(E2E_PREFIX)) {
    return "e2e";
  }
  if (/\.(?:test|spec)\./u.test(basename)) {
    return "test";
  }
  if (/(?:^|\.)stories\./u.test(basename)) {
    return "story";
  }

  return "source";
}

/*
 * Parses `git diff --numstat -z`. The NUL-delimited form is used rather than
 * the default because the default quotes and escapes paths containing spaces
 * or non-ASCII bytes, which no amount of splitting recovers reliably. A
 * rename or copy record ends its counts field with an empty path and puts the
 * old and new paths in the two records that follow.
 */
export function parseNumstat(output) {
  const records = output.split("\0");
  const rows = [];
  let index = 0;

  while (index < records.length) {
    const record = records[index];

    index += 1;

    const firstTab = record.indexOf("\t");
    const secondTab = record.indexOf("\t", firstTab + 1);

    if (firstTab === -1 || secondTab === -1) {
      continue;
    }

    const added = record.slice(0, firstTab);
    const deleted = record.slice(firstTab + 1, secondTab);
    let filePath = record.slice(secondTab + 1);

    if (filePath === "") {
      filePath = records[index + 1];
      index += 2;
    }

    rows.push({
      added,
      binary: added === "-" || deleted === "-",
      deleted,
      path: filePath,
    });
  }

  return rows;
}

function emptyTally() {
  return { e2e: 0, lockfile: 0, markdown: 0, source: 0, story: 0, test: 0 };
}

/*
 * A binary row carries `-` for both counts, so it contributes no lines at
 * all; parsing those dashes as numbers is what silently corrupts a total into
 * `NaN`. They are counted as files instead, because 26 regenerated screenshots
 * are worth seeing in the report even though they are zero lines to read.
 */
export function measureDiff(rows) {
  const lines = emptyTally();
  const files = emptyTally();
  let binaryFiles = 0;

  for (const row of rows) {
    if (row.binary) {
      binaryFiles += 1;
      continue;
    }

    const bucket = classifyPath(row.path);

    lines[bucket] += Number(row.added) + Number(row.deleted);
    files[bucket] += 1;
  }

  return { binaryFiles, files, lines };
}

export function resolveStatus(sourceLines, hasException) {
  if (sourceLines > FAILURE_THRESHOLD) {
    return hasException ? "exempt" : "fail";
  }

  return sourceLines > WARNING_THRESHOLD ? "warn" : "pass";
}

const HEADLINES = {
  exempt: "exempt by label",
  fail: "too large",
  pass: "within budget",
  warn: "approaching the cap",
};

function remedyFor(status, sourceLines) {
  if (status === "pass") {
    return `Under the ${WARNING_THRESHOLD}-line warning threshold.`;
  }
  if (status === "exempt") {
    return (
      `${sourceLines} gated source lines is over the ${FAILURE_THRESHOLD}-line ` +
      `cap, but the \`${EXCEPTION_LABEL}\` label is applied, so this is not ` +
      "blocking. Removing the label re-runs the check."
    );
  }

  const verdict =
    status === "fail"
      ? `over the ${FAILURE_THRESHOLD}-line cap`
      : `over the ${WARNING_THRESHOLD}-line warning threshold and under the ` +
        `${FAILURE_THRESHOLD}-line cap`;

  return (
    `${sourceLines} gated source lines is ${verdict}. **Split this pull ` +
    "request**: land the separable parts as their own pull requests so each " +
    "round of review reads a diff it can hold at once. Review cost is " +
    "superlinear in diff size because every round re-reads the whole diff, " +
    "which is the spend this gate exists to recover. If the change genuinely " +
    `cannot be split, apply the \`${EXCEPTION_LABEL}\` label and say in the ` +
    "description why - applying or removing it re-runs this check without a " +
    "push."
  );
}

function tableRows(measurement) {
  const rows = BUCKET_ORDER.map(
    (bucket) =>
      `| ${BUCKET_LABELS[bucket]} | ${measurement.files[bucket]} | ` +
      `${measurement.lines[bucket]} |`,
  );

  rows.push(`| Binary (not counted) | ${measurement.binaryFiles} | n/a |`);

  return rows;
}

export function formatReport(measurement, status, mergeBase) {
  const sourceLines = measurement.lines.source;

  return [
    REPORT_MARKER,
    `### Pull request size: ${HEADLINES[status]}`,
    "",
    `**${sourceLines} gated source lines** changed against merge base ` +
      `\`${mergeBase}\` (warns above ${WARNING_THRESHOLD}, fails above ` +
      `${FAILURE_THRESHOLD}).`,
    "",
    "| Bucket | Files | Lines changed |",
    "| --- | ---: | ---: |",
    ...tableRows(measurement),
    "",
    remedyFor(status, sourceLines),
    "",
  ].join("\n");
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: Infinity });
}

export function measureRange(baseRef, headRef) {
  const mergeBase = git(["merge-base", baseRef, headRef]).trim();
  const numstat = git([
    "diff",
    "--numstat",
    "-z",
    `${baseRef}...${headRef}`,
    "--",
  ]);

  return { measurement: measureDiff(parseNumstat(numstat)), mergeBase };
}

/*
 * The label name and the comment marker are emitted as step outputs rather
 * than repeated in the workflow, so renaming either here cannot leave the
 * workflow matching a string the report no longer uses.
 */
function publish(report, status) {
  process.stdout.write(`${report}\n`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `status=${status}\nmarker=${REPORT_MARKER}\n`,
    );
  }
  if (process.env.PR_SIZE_REPORT_FILE) {
    writeFileSync(process.env.PR_SIZE_REPORT_FILE, report);
  }
}

/*
 * The applied labels arrive as the JSON array GitHub's `toJSON` produces, so
 * the gate rather than the workflow decides which label exempts a pull
 * request. A malformed or absent value means no exemption, never a crash.
 */
export function hasExceptionLabel(labelsJson) {
  try {
    return JSON.parse(labelsJson ?? "[]").includes(EXCEPTION_LABEL);
  } catch {
    return false;
  }
}

function main(argv) {
  const [baseRef, headRef] = argv;

  if (!baseRef || !headRef) {
    throw new Error("Usage: node scripts/prSizeGate.mjs <base-ref> <head-ref>");
  }

  const { measurement, mergeBase } = measureRange(baseRef, headRef);
  const status = resolveStatus(
    measurement.lines.source,
    hasExceptionLabel(process.env.PR_LABELS),
  );

  publish(formatReport(measurement, status, mergeBase), status);

  return status === "fail" ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
