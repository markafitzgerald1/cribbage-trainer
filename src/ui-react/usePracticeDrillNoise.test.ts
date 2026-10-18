import {
  HAND_KEY,
  type Harness,
  analysisOf,
  expectNoDrillStarted,
  expectNoVerdictRecorded,
  freshHarness,
} from "./usePracticeDrill.test.common";
import { describe, expect, it } from "@jest/globals";
import {
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
} from "../ui/discardTally";
import { CribRole } from "../game/expectedCribPoints";
import type { RecordedAdmission } from "../ui/recordedAdmission";

const WITHIN_NOISE: RecordedAdmission = {
  basis: "sampling-noise-v1",
  eligible: false,
};
const NOISE_LOSS = 0.06;

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

  it("masters a hand whose earlier success is followed by a within-noise retry", () => {
    const harness = freshHarness({ seed: true });
    recordEarlierSuccess();
    retry(harness, NOISE_LOSS, WITHIN_NOISE);

    expect(harness.drill().verdict?.isMastered).toBe(true);
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
    expect(readTallyForDisplay().practice[0]?.attempts).toBe(1);
  });

  it("keeps an optimal retry exact", () => {
    const harness = freshHarness({ seed: true });
    retry(harness, 0, { basis: "exact-v1", eligible: false });

    expect(harness.drill().verdict?.isWithinNoise).toBe(false);

    expectStoredAttempt("exact-v1", "success");
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
});
