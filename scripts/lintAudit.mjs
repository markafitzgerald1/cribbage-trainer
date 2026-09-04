/*
 * Wraps `better-npm-audit audit` so a npm.org outage cannot red the whole
 * repo's CI. `better-npm-audit` shells out to `npm audit`, which POSTs to
 * registry.npmjs.org/-/npm/v1/security/advisories/bulk; when that endpoint
 * is degraded ("audit endpoint returned an error", "Unable to process the
 * JSON buffer string", 5xx) the command exits non-zero with no findings and
 * every PR's `build-and-test` fails on infrastructure rather than the tree.
 *
 * A real advisory failure prints a findings table; a transient failure
 * prints a network/endpoint error and no table. `classifyAuditOutcome`
 * separates the two: real findings — and any non-zero exit with no
 * recognized cause — still fail the build, so the gate keeps its teeth.
 * Only an unambiguous endpoint outage is retried and, if it never clears,
 * allowed to pass with a loud warning; a later run re-checks advisories.
 */
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { spawnSync } from "node:child_process";

export const MAX_ATTEMPTS = 3;
export const BACKOFF_MS = 20_000;

// Substrings that mark the audit service being unreachable rather than the
// tree being vulnerable. Matched case-insensitively against combined output.
export const TRANSIENT_MARKERS = [
  "audit endpoint returned an error",
  "unable to process the json buffer string",
  "service unavailable",
  "internal server error",
  "bad gateway",
  "gateway timeout",
  "econnreset",
  "etimedout",
  "eai_again",
  "enotfound",
  "enetunreach",
  "socket hang up",
  "network error",
  " 429 ",
  " 502 ",
  " 503 ",
  " 504 ",
];

// Substrings that mark genuine findings — better-npm-audit's own report, or
// the underlying npm audit report it forwards. If any appear, a non-zero
// exit is a real failure and must not be softened.
export const FINDINGS_MARKERS = [
  "=== npm audit security report ===",
  "vulnerabilities found",
  "vulnerabilities (",
  "severity vulnerabilities",
  "severity vulnerability",
];

const includesAny = (haystack, needles) => {
  const lowered = haystack.toLowerCase();
  return needles.some((needle) => lowered.includes(needle));
};

/*
 * "pass"      — audit succeeded, nothing to do.
 * "fail"      — real findings, or a non-zero exit with no recognized cause.
 * "transient" — the audit endpoint looks unreachable; safe to retry / soften.
 */
export const classifyAuditOutcome = ({ status, output }) => {
  if (status === 0) {
    return "pass";
  }
  if (includesAny(output, FINDINGS_MARKERS)) {
    return "fail";
  }
  return includesAny(output, TRANSIENT_MARKERS) ? "transient" : "fail";
};

const runAuditOnce = () => {
  const result = spawnSync(
    "npx",
    ["--no-install", "better-npm-audit", "audit"],
    { encoding: "utf8", shell: process.platform === "win32" },
  );
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  process.stdout.write(output);
  return { output, status: result.status ?? 1 };
};

const note = (message) => process.stderr.write(`\nlintAudit: ${message}\n`);

/*
 * Recursive rather than a loop so there is no await inside a loop body.
 * `runOnce` and `wait` are injectable so the retry/classification behavior
 * is unit-testable without a real audit call. Returns the process exit code.
 */
export const runAuditWithResilience = async (
  { runOnce = runAuditOnce, wait = sleep } = {},
  attempt = 1,
) => {
  const outcome = classifyAuditOutcome(runOnce());

  if (outcome === "pass") {
    return 0;
  }
  if (outcome === "fail") {
    note(
      "advisories reported, or an unrecognized failure — failing the build.",
    );
    return 1;
  }
  if (attempt >= MAX_ATTEMPTS) {
    note(
      `the npm audit endpoint stayed unreachable across ${MAX_ATTEMPTS} ` +
        "attempts. Passing this run so a registry outage does not block CI; " +
        "a later run re-checks advisories.",
    );
    return 0;
  }

  note(
    `audit endpoint looks unreachable (attempt ${attempt}/${MAX_ATTEMPTS}); ` +
      `retrying in ${BACKOFF_MS / 1000}s.`,
  );
  await wait(BACKOFF_MS);
  return runAuditWithResilience({ runOnce, wait }, attempt + 1);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await runAuditWithResilience());
}
