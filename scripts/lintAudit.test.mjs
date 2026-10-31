import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  classifyAuditOutcome,
  runAuditOnce,
  runAuditWithResilience,
} from "./lintAudit.mjs";
import { strictEqual } from "node:assert/strict";
import { test } from "node:test";

// A trimmed sample of the real better-npm-audit output when npm.org's
// advisories/bulk endpoint is degraded — the failure this wrapper exists for.
const ENDPOINT_OUTAGE = [
  "> better-npm-audit audit",
  "npm warn audit 503 Service Unavailable - POST https://registry.npmjs.org/-/npm/v1/security/advisories/bulk",
  "npm error audit endpoint returned an error",
  "Unable to process the JSON buffer string.",
].join("\n");

// A trimmed sample of better-npm-audit reporting genuine advisories.
const REAL_FINDINGS = [
  "> better-npm-audit audit",
  "                       === npm audit security report ===",
  "high           Prototype Pollution",
  "8 vulnerabilities (2 low, 6 high)",
].join("\n");

test("classifyAuditOutcome: zero exit is a pass regardless of output", () => {
  strictEqual(classifyAuditOutcome({ output: "anything", status: 0 }), "pass");
});

test("classifyAuditOutcome: an endpoint outage is transient", () => {
  strictEqual(
    classifyAuditOutcome({ output: ENDPOINT_OUTAGE, status: 1 }),
    "transient",
  );
});

test("classifyAuditOutcome: real advisories fail even if the text mentions a 503", () => {
  strictEqual(
    classifyAuditOutcome({
      output: `${REAL_FINDINGS}\nnpm warn audit 503 earlier`,
      status: 1,
    }),
    "fail",
  );
});

test("classifyAuditOutcome: an unexplained timeout fails rather than passing", () => {
  // A killed child proves nothing about why. Softening every timeout would let
  // three stalled attempts return success with no audit result at all.
  strictEqual(classifyAuditOutcome({ output: "", status: 1 }), "fail");
});

test("classifyAuditOutcome: a timeout whose output names an outage is transient", () => {
  strictEqual(
    classifyAuditOutcome({ output: ENDPOINT_OUTAGE, status: 1 }),
    "transient",
  );
});

// A stand-in for spawnSync that records how it was called and replays a
// prepared result, so the timeout branch runs without a real audit.
const spawnStub = (result) => {
  const calls = [];
  const spawn = (command, args, options) => {
    calls.push({ args, command, options });
    return result;
  };
  return { calls, spawn };
};

const TIMED_OUT = { error: { code: "ETIMEDOUT" }, status: null, stderr: "" };

test("runAuditOnce bounds the child process with ATTEMPT_TIMEOUT_MS", () => {
  // Without this assertion, deleting the timeout option leaves every other
  // test passing while the attempt becomes unbounded again.
  const stub = spawnStub({ status: 0, stderr: "", stdout: "" });
  runAuditOnce({ spawn: stub.spawn });
  strictEqual(stub.calls[0].options.timeout, ATTEMPT_TIMEOUT_MS);
});

test("runAuditOnce reports a killed child as a non-zero status", () => {
  const stub = spawnStub({ ...TIMED_OUT, stdout: "" });
  strictEqual(runAuditOnce({ spawn: stub.spawn }).status, 1);
});

test("a timeout explaining nothing is retryable but never transient", () => {
  // "transient" is the outcome that softens to a pass once retries run out.
  const stub = spawnStub({ ...TIMED_OUT, stdout: "" });
  strictEqual(
    classifyAuditOutcome(runAuditOnce({ spawn: stub.spawn })),
    "timeout",
  );
});

test("a timeout whose transcript names an outage is softened", () => {
  const stub = spawnStub({ ...TIMED_OUT, stdout: ENDPOINT_OUTAGE });
  strictEqual(
    classifyAuditOutcome(runAuditOnce({ spawn: stub.spawn })),
    "transient",
  );
});

test("ATTEMPT_TIMEOUT_MS bounds an attempt well under npm's fetch-timeout", () => {
  strictEqual(ATTEMPT_TIMEOUT_MS < 300_000, true);
});

test("classifyAuditOutcome: an unrecognized non-zero exit fails closed", () => {
  strictEqual(
    classifyAuditOutcome({ output: "some brand new error", status: 1 }),
    "fail",
  );
});

test("runAuditWithResilience: passes immediately when audit succeeds", async () => {
  let calls = 0;
  const code = await runAuditWithResilience({
    runOnce: () => {
      calls += 1;
      return { output: "", status: 0 };
    },
    wait: () => Promise.resolve(),
  });

  strictEqual(code, 0);
  strictEqual(calls, 1);
});

test("runAuditWithResilience: retries a transient failure, then softens to pass", async () => {
  let calls = 0;
  const code = await runAuditWithResilience({
    runOnce: () => {
      calls += 1;
      return { output: ENDPOINT_OUTAGE, status: 1 };
    },
    wait: () => Promise.resolve(),
  });

  strictEqual(code, 0);
  strictEqual(calls, 3);
});

test("runAuditWithResilience: a recovered endpoint on retry passes without softening", async () => {
  let calls = 0;
  const code = await runAuditWithResilience({
    runOnce: () => {
      calls += 1;
      return calls === 1
        ? { output: ENDPOINT_OUTAGE, status: 1 }
        : { output: "", status: 0 };
    },
    wait: () => Promise.resolve(),
  });

  strictEqual(code, 0);
  strictEqual(calls, 2);
});

test("runAuditWithResilience: real findings fail on the first attempt", async () => {
  let calls = 0;
  const code = await runAuditWithResilience({
    runOnce: () => {
      calls += 1;
      return { output: REAL_FINDINGS, status: 1 };
    },
    wait: () => Promise.resolve(),
  });

  strictEqual(code, 1);
  strictEqual(calls, 1);
});

// Replays prepared attempt results in order, counting how many ran.
const attemptSequence = (results) => {
  let calls = 0;
  const runOnce = () => {
    const result = results.at(Math.min(calls, results.length - 1));
    calls += 1;
    return result;
  };
  return { calls: () => calls, runOnce };
};

const SILENT_TIMEOUT = { output: "", status: 1, timedOut: true };
const PASSED = { output: "", status: 0 };
const OUTAGE = { output: ENDPOINT_OUTAGE, status: 1 };
const noWait = () => Promise.resolve();

test("runAuditOnce marks a killed child as timed out", () => {
  const stub = spawnStub({ ...TIMED_OUT, stdout: "" });
  strictEqual(runAuditOnce({ spawn: stub.spawn }).timedOut, true);
});

test("runAuditOnce does not mark a completed child as timed out", () => {
  const stub = spawnStub({ status: 1, stderr: "", stdout: "" });
  strictEqual(runAuditOnce({ spawn: stub.spawn }).timedOut, false);
});

test("classifyAuditOutcome: a silent timeout is its own outcome", () => {
  strictEqual(classifyAuditOutcome(SILENT_TIMEOUT), "timeout");
});

test("classifyAuditOutcome: a silent non-zero exit without a timeout still fails", () => {
  strictEqual(
    classifyAuditOutcome({ output: "", status: 1, timedOut: false }),
    "fail",
  );
});

test("runAuditWithResilience: a timed-out attempt is retried and a completed retry passes", async () => {
  const sequence = attemptSequence([SILENT_TIMEOUT, PASSED]);
  const code = await runAuditWithResilience({
    runOnce: sequence.runOnce,
    wait: noWait,
  });

  strictEqual(code, 0);
  strictEqual(sequence.calls(), 2);
});

test("runAuditWithResilience: every attempt timing out fails after MAX_ATTEMPTS", async () => {
  const sequence = attemptSequence([SILENT_TIMEOUT]);
  const code = await runAuditWithResilience({
    runOnce: sequence.runOnce,
    wait: noWait,
  });

  strictEqual(code, 1);
  strictEqual(sequence.calls(), MAX_ATTEMPTS);
});

// A run that ever timed out has an attempt nobody can explain, so a later
// endpoint outage must not soften it into a pass the way a pure outage is.
for (const [name, results] of [
  ["a timeout then outages", [SILENT_TIMEOUT, OUTAGE]],
  ["an outage then timeouts", [OUTAGE, SILENT_TIMEOUT]],
  ["outages ending in a timeout", [OUTAGE, OUTAGE, SILENT_TIMEOUT]],
]) {
  test(`runAuditWithResilience: ${name} fails rather than softening`, async () => {
    const sequence = attemptSequence(results);
    const code = await runAuditWithResilience({
      runOnce: sequence.runOnce,
      wait: noWait,
    });

    strictEqual(code, 1);
    strictEqual(sequence.calls(), MAX_ATTEMPTS);
  });
}

test("runAuditWithResilience: real findings after a timeout still fail at once", async () => {
  const sequence = attemptSequence([
    SILENT_TIMEOUT,
    { output: REAL_FINDINGS, status: 1 },
  ]);
  const code = await runAuditWithResilience({
    runOnce: sequence.runOnce,
    wait: noWait,
  });

  strictEqual(code, 1);
  strictEqual(sequence.calls(), 2);
});
