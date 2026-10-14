import { AT, decisionOf } from "../ui/discardTally.test.common";
import {
  type DiscardDecisionRecord,
  type DiscardTallySummary,
  clearDiscardTally,
  readDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
} from "../ui/discardTally";
import {
  RECOVERY_GRACE_MS,
  type RecordDecision,
  useAdmissionRecording,
} from "./useAdmissionRecording";
import { StrictMode, useEffect } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import type { DeadlineJudgment } from "../ui/recordedAdmission";
import { SIDECAR_SETTLE_TIMEOUT_MS } from "./useUncertainty";

const pendingDecision = () => decisionOf({ recordedAdmission: "pending" });
const storedAdmission = () =>
  readTallyForDisplay().records[0]?.recordedAdmission;
const storedAdmissions = () =>
  readTallyForDisplay().records.map((record) => record.recordedAdmission);
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
const yesterdaySettlement = ({
  owned,
  judge,
  onWritten,
}: {
  owned: boolean;
  judge: DeadlineJudgment | null;
  onWritten: ReturnType<typeof jest.fn>;
}) => {
  jest.setSystemTime(AT);
  const decision = pendingDecision();
  const owner = recordingHook(onWritten);
  if (owned) {
    owner.result.current(decision, judge);
  } else {
    recordDiscardDecision(decision);
  }
  jest.setSystemTime(AT + 86_400_000);
  recordDiscardDecision(
    decisionOf({
      at: Date.now(),
      expectedPointsLoss: 0,
      handKey: "today",
      isOptimal: true,
    }),
  );
  return { owner, recovery: owned ? owner : recordingHook(onWritten) };
};
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
const recordPending = (
  record: RecordDecision,
  decision: DiscardDecisionRecord,
  judge: DeadlineJudgment | null = null,
) => {
  act(() => {
    record(decision, judge);
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

const ownerSettlesBesideSecondTab = ({
  judgeAtDeadline,
  ownerWriteLag,
  settle,
}: {
  judgeAtDeadline: DeadlineJudgment | null;
  ownerWriteLag: number;
  settle: (record: RecordDecision, decision: DiscardDecisionRecord) => void;
}) => {
  const owner = recordingHook();
  const decision = { ...pendingDecision(), at: Date.now() };
  waitOut(ownerWriteLag);
  act(() => {
    owner.result.current(decision, judgeAtDeadline);
  });
  const secondTab = recordingHook();
  settle(owner.result.current, decision);

  expect(storedAdmission()).toStrictEqual(noiseAdmission);

  secondTab.unmount();
  owner.unmount();
};

describe("decision-owned admission settlement", () => {
  it.each([0, 100])(
    "keeps separate study and authentic deadlines %i ms apart",
    (gap) => {
      expectWithClock(() => {
        const hook = recordingHook();
        const study = {
          ...pendingDecision(),
          at: Date.now(),
          isPractice: true,
        };
        recordPending(hook.result.current, study, () => noiseAdmission);
        waitOut(gap);
        const authentic = { ...study, at: Date.now(), isPractice: false };
        recordPending(hook.result.current, authentic);

        waitOut(SIDECAR_SETTLE_TIMEOUT_MS - gap - 1);

        expect(storedAdmissions()).toStrictEqual(["pending", "pending"]);

        waitOut(gap + 1);

        expect(storedAdmissions()).toStrictEqual([
          noiseAdmission,
          { basis: "exact-fallback-v1", eligible: true },
        ]);
        expect(
          readTallyForDisplay().records.map((record) => record.at),
        ).toStrictEqual([study.at, authentic.at]);

        hook.unmount();
      });
    },
  );

  it("returns today's summary when a live report settles yesterday's row", () => {
    expectWithClock(() => {
      const { owner } = yesterdaySettlement({
        judge: null,
        onWritten: jest.fn(),
        owned: true,
      });
      let reported: DiscardTallySummary | null = null;
      act(() => {
        reported = owner.result.current({
          ...pendingDecision(),
          at: Date.now(),
          recordedAdmission: noiseAdmission,
        });
      });

      expect(storedAdmission()).toStrictEqual(noiseAdmission);
      expect(reported).toStrictEqual(readDiscardTally(Date.now()));
      expect(reported).toStrictEqual(
        expect.objectContaining({ todayOptimalDecisions: 1 }),
      );

      owner.unmount();
    });
  });

  it.each([
    { judge: null, name: "recovery", owned: false },
    { judge: null, name: "the owner's exact deadline", owned: true },
    {
      judge: () => noiseAdmission,
      name: "the owner's judged deadline",
      owned: true,
    },
  ])(
    "reports today's summary after $name settles yesterday's row",
    ({ owned, judge }) => {
      expectWithClock(() => {
        const onWritten = jest.fn();
        const { owner, recovery } = yesterdaySettlement({
          judge,
          onWritten,
          owned,
        });
        waitOut();

        expect(onWritten).toHaveBeenLastCalledWith(
          readDiscardTally(Date.now()),
        );
        expect(onWritten).toHaveBeenLastCalledWith(
          expect.objectContaining({
            todayDecisions: 1,
            todayMeanExpectedPointsLoss: 0,
            todayOptimalDecisions: 1,
          }),
        );
        expect(readTallyForDisplay().records[0]?.at).toBe(AT);

        recovery.unmount();
        owner.unmount();
      });
    },
  );

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
      atFor: (now: number) =>
        now - SIDECAR_SETTLE_TIMEOUT_MS - RECOVERY_GRACE_MS,
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
      ownerSettlesBesideSecondTab({
        judgeAtDeadline: null,
        ownerWriteLag: 0,
        settle: (record, decision) => {
          expect(storedAdmission()).toBe("pending");

          settleAsNoiseThenWaitOut(record, decision);
        },
      });
    });
  });

  it.each([0, 3_600_000])(
    "bounds orphan recovery from mount with a %i ms clock rollback",
    (rollback) => {
      expectWithClock(() => {
        recordDiscardDecision({ ...pendingDecision(), at: Date.now() });
        const recordedAt = Date.now();
        jest.setSystemTime(recordedAt - rollback);
        const hook = recordingHook();
        waitOut(SIDECAR_SETTLE_TIMEOUT_MS + RECOVERY_GRACE_MS - 1);

        expect(storedAdmission()).toBe("pending");

        waitOut(1);
        expectExactFallback();

        expect(readTallyForDisplay().records[0]?.at).toBe(recordedAt);

        hook.unmount();
      });
    },
  );

  it("lets a live owner's deadline judgment land before another tab's recovery", () => {
    expectWithClock(() => {
      ownerSettlesBesideSecondTab({
        judgeAtDeadline: () => noiseAdmission,
        // A literal lag, so that zeroing the grace cannot also zero the race it guards.
        ownerWriteLag: 500,
        settle: () => {
          waitOut();
        },
      });
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
