import {
  EXCEPTION_LABEL,
  FAILURE_THRESHOLD,
  REPORT_MARKER,
  WARNING_THRESHOLD,
  classifyPath,
  formatReport,
  hasExceptionLabel,
  measureDiff,
  parseNumstat,
  resolveStatus,
} from "./prSizeGate.mjs";
import { deepStrictEqual, match, strictEqual } from "node:assert/strict";
import { test } from "node:test";

/*
 * `git diff --numstat -z` terminates every record with a NUL. A rename record
 * leaves the path field of the counts record empty and follows it with the
 * old and new paths as two further records, which is why the fixtures below
 * are written as records rather than lines.
 */
function numstat(records) {
  return `${records.join("\0")}\0`;
}

const measure = (records) => measureDiff(parseNumstat(numstat(records)));

/*
 * The real diff of #813, the Dependabot pull request the issue cites: 4,867
 * raw changed lines, 66 once the lockfile is set aside. Gating the raw number
 * would fire on every dependency bump and teach everyone to ignore the check.
 */
const DEPENDABOT_RECORDS = [
  "2466\t2335\tpackage-lock.json",
  "33\t33\tpackage.json",
];

test("classifyPath sorts each path into the bucket the gate reports", () => {
  const classified = [
    "package-lock.json",
    "yarn.lock",
    "AGENTS.md",
    "skills/testing-e2e/SKILL.md",
    "tests-e2e/index.screenshots.spec.ts",
    "tests-e2e/index.screenshots.spec.ts-snapshots/portrait-1-chromium.png",
    "src/analysis/optimalDiscard.test.ts",
    "src/ui-react/Trainer.test.tsx",
    "src/ui-react/usePracticeDrill.test.common.ts",
    "src/ui-react/Trainer.stories.tsx",
    "src/ui-react/stories.common.ts",
    "src/ui/strayDrillRecords.ts",
    "src/ui-react/Trainer.module.css",
    "vite.config.mjs",
  ].map(classifyPath);

  deepStrictEqual(classified, [
    "lockfile",
    "lockfile",
    "markdown",
    "markdown",
    "e2e",
    "e2e",
    "test",
    "test",
    "test",
    "story",
    "story",
    "source",
    "source",
    "source",
  ]);
});

test("a binary row contributes no lines and never poisons the total", () => {
  const { binaryFiles, lines } = measure([
    "59\t0\tsrc/analysis/optimalDiscard.ts",
    "-\t-\ttests-e2e/index.screenshots.spec.ts-snapshots/portrait-1-chromium.png",
    "-\t-\tsrc/assets/card-back.png",
  ]);

  strictEqual(binaryFiles, 2);
  strictEqual(lines.source, 59);
  strictEqual(Number.isNaN(lines.source), false);
  strictEqual(lines.e2e, 0);
});

test("a lockfile row is measured but kept out of the gated count", () => {
  const { files, lines } = measure(DEPENDABOT_RECORDS);

  strictEqual(lines.source, 66);
  strictEqual(lines.lockfile, 4801);
  strictEqual(files.lockfile, 1);
});

test("a rename record is attributed to its new path, not to a mangled one", () => {
  const { files, lines } = measure([
    "4\t2\t",
    "src/ui/oldName.ts",
    "src/ui/newName.ts",
    "9\t0\tsrc/ui/other.ts",
  ]);

  strictEqual(lines.source, 15);
  strictEqual(files.source, 2);
});

test("tests, stories, e2e and Markdown are measured but not gated", () => {
  const { lines } = measure([
    "83\t19\tsrc/ui-react/ScoredPossibleKeepDiscards.tsx",
    "140\t29\tsrc/ui-react/ScoredPossibleKeepDiscards.test.tsx",
    "16\t6\tsrc/ui-react/ScoredPossibleKeepDiscard.stories.ts",
    "20\t0\ttests-e2e/index.screenshots.spec.ts",
    "109\t4\tAGENTS.md",
  ]);

  deepStrictEqual(lines, {
    e2e: 20,
    lockfile: 0,
    markdown: 113,
    source: 102,
    story: 22,
    test: 169,
  });
});

test("an empty diff measures as zero rather than as one empty path", () => {
  const { binaryFiles, files, lines } = measure([]);

  strictEqual(lines.source, 0);
  strictEqual(files.source, 0);
  strictEqual(binaryFiles, 0);
});

test("resolveStatus treats both thresholds as exclusive upper bounds", () => {
  deepStrictEqual(
    [
      resolveStatus(WARNING_THRESHOLD, false),
      resolveStatus(WARNING_THRESHOLD + 1, false),
      resolveStatus(FAILURE_THRESHOLD, false),
      resolveStatus(FAILURE_THRESHOLD + 1, false),
    ],
    ["pass", "warn", "warn", "fail"],
  );
});

test("the size-exception label downgrades a failure and nothing else", () => {
  strictEqual(resolveStatus(FAILURE_THRESHOLD + 1, true), "exempt");
  strictEqual(resolveStatus(WARNING_THRESHOLD + 1, true), "warn");
  strictEqual(resolveStatus(0, true), "pass");
});

test("the exemption reads the applied labels, and fails closed", () => {
  strictEqual(hasExceptionLabel(JSON.stringify([EXCEPTION_LABEL])), true);
  strictEqual(
    hasExceptionLabel(JSON.stringify(["bug", EXCEPTION_LABEL, "ci"])),
    true,
  );
  strictEqual(hasExceptionLabel(JSON.stringify(["bug"])), false);
  strictEqual(hasExceptionLabel("[]"), false);
  strictEqual(hasExceptionLabel("not json"), false);
  strictEqual(hasExceptionLabel(), false);
});

test("a failing report names every bucket, the count, and splitting", () => {
  const measurement = measure([
    "500\t0\tsrc/ui/strayDrillRecords.ts",
    "309\t0\tsrc/ui/strayDrillRecords.test.ts",
    "-\t-\ttests-e2e/index.screenshots.spec.ts-snapshots/portrait-1-chromium.png",
  ]);
  const report = formatReport(measurement, "fail", "abc1234");

  strictEqual(report.startsWith(REPORT_MARKER), true);
  match(report, /\*\*500 gated source lines\*\*/u);
  match(report, /abc1234/u);
  match(report, /\| Source \(gated\) \| 1 \| 500 \|/u);
  match(report, /\| Tests \| 1 \| 309 \|/u);
  match(report, /\| Binary \(not counted\) \| 1 \| n\/a \|/u);
  match(report, /Split this pull request/u);
  strictEqual(report.includes(EXCEPTION_LABEL), true);
});

test("an exempt report says the label is why it is not blocking", () => {
  const measurement = measure(["500\t0\tsrc/ui/strayDrillRecords.ts"]);
  const report = formatReport(measurement, "exempt", "abc1234");

  match(report, /exempt by label/u);
  match(report, /Removing the label re-runs the check/u);
});
