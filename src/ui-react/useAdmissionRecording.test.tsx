import { AT, decisionOf } from "../ui/discardTally.test.common";
import {
  type DiscardDecisionRecord,
  clearDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
} from "../ui/discardTally";
import {
  type RecordDecision,
  useAdmissionRecording,
} from "./useAdmissionRecording";
import { StrictMode, useEffect } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { SIDECAR_SETTLE_TIMEOUT_MS } from "./useUncertainty";

const pendingDecision = () => decisionOf({ recordedAdmission: "pending" });
const storedAdmission = () =>
  readTallyForDisplay().records[0]?.recordedAdmission;
const noiseAdmission = { basis: "sampling-noise-v1", eligible: false } as const;

const expectWithClock = (run: () => void) => {
  clearDiscardTally();
  jest.useFakeTimers();
  try {
    run();
  } finally {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  }
};

const recordingHook = (onWritten = jest.fn()) =>
  renderHook(() => useAdmissionRecording(onWritten));
const expectExactFallback = () =>
  expect(storedAdmission()).toStrictEqual({
    basis: "exact-fallback-v1",
    eligible: true,
  });
const waitOut = (milliseconds = SIDECAR_SETTLE_TIMEOUT_MS) => {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
};
const settleAsNoiseThenWaitOut = (
  record: RecordDecision,
  decision: DiscardDecisionRecord,
) => {
  act(() => {
    record({ ...decision, recordedAdmission: noiseAdmission });
  });
  waitOut();
};

describe("decision-owned admission settlement", () => {
  it("keeps the first original noise settlement reachable during StrictMode replay", () => {
    expectWithClock(() => {
      const onWritten = jest.fn();
      const view = renderHook(
        () => {
          const record = useAdmissionRecording(onWritten);
          useEffect(() => {
            record(pendingDecision());
          }, [record]);
          return record;
        },
        { wrapper: StrictMode },
      );

      expect(storedAdmission()).toBe("pending");

      settleAsNoiseThenWaitOut(view.result.current, pendingDecision());

      expect(storedAdmission()).toStrictEqual(noiseAdmission);

      view.unmount();
    });
  });

  it("keeps the original deadline after a stale choice and unmount", () => {
    expectWithClock(() => {
      const onWritten = jest.fn();
      const hook = recordingHook(onWritten);
      act(() => {
        hook.result.current(pendingDecision());
        hook.result.current({
          ...pendingDecision(),
          discardKey: "AH,2H",
          recordedAdmission: noiseAdmission,
        });
      });
      hook.unmount();

      expect(storedAdmission()).toBe("pending");

      waitOut();
      expectExactFallback();

      expect(onWritten).toHaveBeenLastCalledWith(
        expect.objectContaining({ decisions: 1 }),
      );

      hook.unmount();
    });
  });

  it("freezes a valid original settlement and rejects a later different choice", () => {
    expectWithClock(() => {
      const hook = recordingHook();
      const decision = pendingDecision();
      act(() => {
        hook.result.current(decision);
        hook.result.current({
          ...decision,
          at: decision.at + 100,
          recordedAdmission: noiseAdmission,
        });
        hook.result.current({
          ...decision,
          recordedAdmission: { basis: "exact-fallback-v1", eligible: true },
        });
      });

      expect(storedAdmission()).toStrictEqual(noiseAdmission);

      hook.unmount();
    });
  });

  it.each([
    {
      atFor: () => AT,
      name: "a crashed pending row without accepting today's noise judgment",
    },
    {
      atFor: (now: number) => now - SIDECAR_SETTLE_TIMEOUT_MS,
      name: "a pending row whose owner's deadline has just passed",
    },
  ])("settles on mount $name", ({ atFor }) => {
    expectWithClock(() => {
      recordDiscardDecision({ ...pendingDecision(), at: atFor(Date.now()) });
      const hook = recordingHook();

      expectExactFallback();

      hook.unmount();
    });
  });

  it("leaves a live pending row to the tab that owns it", () => {
    expectWithClock(() => {
      const owner = recordingHook();
      const decision = { ...pendingDecision(), at: Date.now() };
      act(() => {
        owner.result.current(decision);
      });
      const secondTab = recordingHook();

      expect(storedAdmission()).toBe("pending");

      settleAsNoiseThenWaitOut(owner.result.current, decision);

      expect(storedAdmission()).toStrictEqual(noiseAdmission);

      secondTab.unmount();
      owner.unmount();
    });
  });

  it("settles a young pending row nobody owns at its own deadline", () => {
    expectWithClock(() => {
      recordDiscardDecision({ ...pendingDecision(), at: Date.now() });
      const hook = recordingHook();
      waitOut(SIDECAR_SETTLE_TIMEOUT_MS - 1);

      expect(storedAdmission()).toBe("pending");

      waitOut(1);
      expectExactFallback();

      hook.unmount();
    });
  });

  it("settles a decision whose analysis was left from its own deadline judgment", () => {
    expectWithClock(() => {
      const hook = recordingHook();
      act(() => {
        hook.result.current(pendingDecision(), () => noiseAdmission);
      });
      hook.unmount();
      waitOut();

      expect(storedAdmission()).toStrictEqual(noiseAdmission);
    });
  });

  it("does not read storage again when it re-renders", () => {
    expectWithClock(() => {
      const reads = jest.spyOn(Storage.prototype, "getItem");
      try {
        const hook = recordingHook();
        const readsAfterMount = reads.mock.calls.length;
        for (let render = 0; render < 10; render += 1) {
          hook.rerender();
        }

        expect(reads).toHaveBeenCalledTimes(readsAfterMount);

        hook.unmount();
      } finally {
        reads.mockRestore();
      }
    });
  });
});
