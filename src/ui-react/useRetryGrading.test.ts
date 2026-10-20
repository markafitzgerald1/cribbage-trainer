import { describe, expect, it, jest } from "@jest/globals";
import { elapse, withFakeTimers } from "./usePracticeDrill.test.common";
import { SIDECAR_SETTLE_TIMEOUT_MS } from "./useUncertainty";
import type { SettledAdmission } from "../ui/recordedAdmission";
import { renderHook } from "@testing-library/react";
import { useRetryGrading } from "./useRetryGrading";

const WITHIN_NOISE: SettledAdmission = {
  basis: "sampling-noise-v1",
  eligible: false,
};
const EXACT_MISS: SettledAdmission = {
  basis: "exact-fallback-v1",
  eligible: true,
};
const AFTER_GRACE_MS = SIDECAR_SETTLE_TIMEOUT_MS + 1000;

type Retries = ReturnType<typeof useRetryGrading>;

const grading = () => renderHook(() => useRetryGrading()).result.current;

const withPendingA = (run: () => void) => {
  const retries = grading();
  retries.defer("A", () => EXACT_MISS, run);
  return retries;
};

describe("useRetryGrading", () => {
  it("keeps an earlier drill's timer from canceling or doubling a later drill's", () => {
    const [first, second] = [jest.fn(), jest.fn()];
    withFakeTimers(() => {
      const retries = withPendingA(first);
      retries.start("B");
      retries.defer("B", () => EXACT_MISS, second);
      retries.settle();
      elapse(AFTER_GRACE_MS);
    });

    expect([first.mock.calls.length, second.mock.calls.length]).toStrictEqual([
      1, 0,
    ]);
  });

  it("grades an earlier pending retry before the same hand starts again", () => {
    const earlier = jest.fn();
    withFakeTimers(() => {
      const retries = withPendingA(earlier);
      elapse(1);
      retries.start("A");
    });

    expect(earlier).toHaveBeenCalledWith(EXACT_MISS, true);
  });

  it("takes the verdict at the sidecars' deadline, not after the grace", () => {
    const run = jest.fn();
    let judged = EXACT_MISS;
    withFakeTimers(() => {
      grading().defer("A", () => judged, run);
      elapse(SIDECAR_SETTLE_TIMEOUT_MS);
      judged = WITHIN_NOISE;
      elapse(AFTER_GRACE_MS);
    });

    expect(run).toHaveBeenCalledWith(EXACT_MISS, true);
  });

  it("leaves another hand's pending retry waiting for its own deadline", () => {
    const run = jest.fn();
    withFakeTimers(() => {
      withPendingA(run).start("B");
      elapse(SIDECAR_SETTLE_TIMEOUT_MS);
    });

    expect(run).not.toHaveBeenCalled();
  });

  it.each([
    {
      after: () => null,
      calls: 0,
      name: "not yet during the grace",
      waited: SIDECAR_SETTLE_TIMEOUT_MS + 100,
    },
    {
      after: () => null,
      calls: 1,
      name: "once the grace has passed",
      waited: AFTER_GRACE_MS,
    },
    {
      after: (retries: Retries) => retries.start("A"),
      calls: 1,
      name: "once, even when the same hand restarts after the deadline",
      waited: AFTER_GRACE_MS,
    },
  ])("grades $name", ({ after, calls, waited }) => {
    const run = jest.fn();
    withFakeTimers(() => {
      const retries = withPendingA(run);
      elapse(waited);
      after(retries);
    });

    expect(run).toHaveBeenCalledTimes(calls);
  });
});
