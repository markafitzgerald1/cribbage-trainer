/* jscpd:ignore-start */
import {
  HAND_KEY,
  type Harness,
  analysisOf,
  committedHarness,
  elapse,
  expectNoDrillStarted,
  expectNoVerdictRecorded,
  freshHarness,
  refuseWrites,
  withFakeTimers,
} from "./usePracticeDrill.test.common";
import type {
  RecordedAdmission,
  SettledAdmission,
} from "../ui/recordedAdmission";
import { describe, expect, it, jest } from "@jest/globals";
import { mockItemA, mockItemB } from "../ui/mistakeQueue.test.common";
import {
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
} from "../ui/discardTally";
import { CribRole } from "../game/expectedCribPoints";
import { SIDECAR_SETTLE_TIMEOUT_MS } from "./useUncertainty";
/* jscpd:ignore-end */

const WITHIN_NOISE: SettledAdmission = {
  basis: "sampling-noise-v1",
  eligible: false,
};
const NOISE_LOSS = 0.06;
const DEADLINE_MS = SIDECAR_SETTLE_TIMEOUT_MS + 1000;

const retry = (
  harness: Harness,
  loss: number,
  admission: RecordedAdmission | null,
) => {
  harness.start();
  harness.commit();
  harness.render(analysisOf(loss === 0, loss), null, admission);
};

const retryWith = (admission: RecordedAdmission | null): Harness => {
  const harness = freshHarness({ seed: true });
  retry(harness, NOISE_LOSS, admission);
  return harness;
};

const recordEarlierSuccess = () =>
  recordPracticeAttempt({ at: 1, handKey: HAND_KEY, isOptimal: true });

const expectOneAttempt = () => {
  expect(readTallyForDisplay().practice[0]?.attempts).toBe(1);
};

const expectStoredAttempt = (basis: string, outcome: string) => {
  expect(readTallyForDisplay().attemptLog?.at(-1)).toMatchObject({
    basis,
    outcome,
  });
};

describe("grading a drill retry by the caption's verdict", () => {
  it("counts a within-noise retry as a success, keeping the exact loss", () => {
    const harness = retryWith(WITHIN_NOISE);
    const [practice] = readTallyForDisplay().practice;

    expect(harness.drill().verdict).toMatchObject({
      chosenLoss: NOISE_LOSS,
      consecutiveSuccesses: 1,
      isOptimal: false,
      isWithinNoise: true,
    });
    expect(practice).toMatchObject({ consecutiveSuccesses: 1, wrong: 0 });
    expect(readTallyForDisplay().attemptLog?.at(-1)).toMatchObject({
      expectedPointsLoss: NOISE_LOSS,
      isOptimal: false,
    });

    expectStoredAttempt("sampling-noise-v1", "success");
  });

  it.each([
    {
      expected: { isMastered: true },
      name: "masters a hand whose earlier success is followed by one",
      prepare: recordEarlierSuccess,
    },
    {
      expected: { consecutiveSuccesses: 1 },
      name: "counts toward the streak when a newer tally refuses the write for",
      prepare: refuseWrites,
    },
  ])("$name a within-noise retry", ({ expected, prepare }) => {
    const harness = freshHarness({ seed: true });
    prepare();
    retry(harness, NOISE_LOSS, WITHIN_NOISE);

    expect(harness.drill().verdict).toMatchObject(expected);
  });

  it.each([
    {
      admission: { basis: "exact-fallback-v1", eligible: true },
      name: "an exact fallback",
    },
    {
      admission: { basis: "sampling-noise-v1", eligible: true },
      name: "a sampled verdict beyond the threshold",
    },
    {
      admission: { basis: "sampling-noise-v2", eligible: false },
      name: "a later build's basis",
    },
    { admission: null, name: "no admission" },
  ])("grades $name as a failure, as before", ({ admission }) => {
    expect(retryWith(admission).drill().verdict).toMatchObject({
      consecutiveSuccesses: 0,
      isWithinNoise: false,
    });

    expectStoredAttempt("exact-v1", "failure");
  });

  it("does not grade while the verdict is pending, then grades once settled", () => {
    const harness = retryWith("pending");

    expectNoVerdictRecorded(harness);

    harness.render(analysisOf(false, NOISE_LOSS), null, WITHIN_NOISE);

    expect(harness.drill().verdict?.isWithinNoise).toBe(true);

    expectOneAttempt();
  });

  it("never lets the auto-drill deal a hand recorded as within noise", () => {
    const harness = freshHarness();
    recordDiscardDecision({
      at: Date.now(),
      cribRole: CribRole.Dealer,
      discardKey: "5H,6H",
      expectedPointsLoss: NOISE_LOSS,
      handKey: HAND_KEY,
      isOptimal: false,
      isPractice: false,
      recordedAdmission: WITHIN_NOISE,
    });
    harness.auto();

    expectNoDrillStarted(harness);
  });

  it.each([
    { admission: { basis: "exact-v1", eligible: false }, name: "exact" },
    { admission: WITHIN_NOISE, name: "within-noise" },
  ])(
    "keeps an optimal retry exact under a $name admission",
    ({ admission }) => {
      const harness = freshHarness({ seed: true });
      retry(harness, 0, admission);

      expectStoredAttempt("exact-v1", "success");

      expect(harness.drill().verdict?.isWithinNoise).toBe(false);
    },
  );
});

const elapseDeadline = () => elapse(DEADLINE_MS);

const PENDING_LOSS = 1.5;
const WORSE: SettledAdmission = { basis: "sampling-noise-v1", eligible: true };

const pendingRetry = (judge: () => SettledAdmission): Harness => {
  const harness = committedHarness();
  harness.renderPending(analysisOf(false, PENDING_LOSS), judge);
  return harness;
};

const renderSettled = (harness: Harness) =>
  harness.render(analysisOf(false, PENDING_LOSS), null, WORSE);

describe("a retry whose verdict is still pending", () => {
  it.each([
    { basis: "exact-v1", judged: WORSE, outcome: "failure" },
    { basis: "sampling-noise-v1", judged: WITHIN_NOISE, outcome: "success" },
  ])(
    "is graded by its deadline's verdict ($outcome) when the player leaves first",
    ({ basis, judged, outcome }) => {
      withFakeTimers(() => {
        pendingRetry(() => judged).exit();
        elapseDeadline();
      });

      expectStoredAttempt(basis, outcome);
    },
  );

  it("falls back to an exact grade, once, when it was re-reported without a judge", () => {
    withFakeTimers(() => {
      const harness = committedHarness();
      harness.render(analysisOf(false, PENDING_LOSS), null, "pending");
      harness.render(analysisOf(false, PENDING_LOSS), null, "pending");
      harness.exit();
      elapseDeadline();
    });

    expectOneAttempt();
    expectStoredAttempt("exact-v1", "failure");
  });

  it("records a left retry the moment its hand starts again, under the time it was made", () => {
    const startedAt = 1_800_000_000_000;
    withFakeTimers(() => {
      jest.setSystemTime(startedAt);
      const harness = pendingRetry(() => WORSE);
      harness.exit();
      elapse(1000);
      harness.start(mockItemA);
    });

    expectOneAttempt();

    expect(readTallyForDisplay().attemptLog?.at(-1)?.at).toBe(startedAt);
  });

  it.each([
    { name: "the same hand starts again", next: mockItemA },
    { name: "a different hand has started", next: mockItemB },
  ])("grades a left retry in attempt order when $name", ({ next }) => {
    recordEarlierSuccess();
    withFakeTimers(() => {
      const harness = pendingRetry(() => WORSE);
      harness.exit();
      harness.start(next);
      elapseDeadline();
    });

    expect(readTallyForDisplay().practice[0]).toMatchObject({
      consecutiveSuccesses: 0,
      wrong: 1,
    });
  });

  it.each([
    { name: "settles on screen before its deadline", waitBeforeSettling: 0 },
    {
      name: "passes its deadline before it settles",
      waitBeforeSettling: DEADLINE_MS,
    },
  ])("is recorded once when it $name", ({ waitBeforeSettling }) => {
    withFakeTimers(() => {
      const harness = pendingRetry(() => WORSE);
      elapse(waitBeforeSettling);
      renderSettled(harness);
      elapseDeadline();
    });

    expectOneAttempt();
  });
});
