import { type DealHand, type DealState, useDealHand } from "./useDealHand";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import type { ReportHandReplaced } from "./useAnalysisReporting";

const FRESH_HAND_NOTICE_MS = 3000;

interface Harness {
  readonly dealStates: DealState[];
  readonly markHistoryUpdateCalls: number;
  readonly reportHandReplacedCalls: Parameters<ReportHandReplaced>[];
  readonly result: { current: DealHand };
  readonly unmount: () => void;
}

const setupHarness = (): Harness => {
  const dealStates: DealState[] = [];
  const reportHandReplacedCalls: Parameters<ReportHandReplaced>[] = [];
  const markHistoryUpdate = jest.fn<() => void>();
  const reportHandReplaced: ReportHandReplaced = (cards, cause, cribRole) => {
    reportHandReplacedCalls.push([cards, cause, cribRole]);
  };
  const { result, unmount } = renderHook(() =>
    useDealHand({
      generateRandomNumber: () => 0,
      markHistoryUpdate,
      reportHandReplaced,
      setDealState: (state) => {
        dealStates.push(state);
      },
    }),
  );
  return {
    dealStates,
    get markHistoryUpdateCalls() {
      return markHistoryUpdate.mock.calls.length;
    },
    reportHandReplacedCalls,
    result,
    unmount,
  };
};

const afterPlainDeal = (): Harness => {
  const harness = setupHarness();
  act(() => {
    harness.result.current.deal();
  });
  return harness;
};

const afterDrillExit = (): Harness => {
  jest.useFakeTimers();
  const harness = setupHarness();
  act(() => {
    harness.result.current.dealForDrillExit();
  });
  return harness;
};

describe("useDealHand", () => {
  it("deals a fresh hand through the history and telemetry seams", () => {
    const harness = afterPlainDeal();
    const [dealtState] = harness.dealStates;
    const [reported] = harness.reportHandReplacedCalls;

    expect(harness.markHistoryUpdateCalls).toBe(1);
    expect(dealtState?.dealtCards).toHaveLength(CARDS_PER_DEALT_HAND);
    expect(reported?.[0]).toBe(dealtState?.dealtCards);
    expect(reported?.[1]).toBe("deal");
    expect(reported?.[2]).toBe(dealtState?.cribRole);
  });

  it("leaves the fresh-hand notice hidden for a plain deal", () => {
    expect(afterPlainDeal().result.current.freshHandNoticeShown).toBe(false);
  });

  it("raises the fresh-hand notice on a drill exit, then clears it", () => {
    const harness = afterDrillExit();

    expect(harness.dealStates).toHaveLength(1);
    expect(harness.result.current.freshHandNoticeShown).toBe(true);

    act(() => {
      jest.advanceTimersByTime(FRESH_HAND_NOTICE_MS);
    });
    jest.useRealTimers();

    expect(harness.result.current.freshHandNoticeShown).toBe(false);
  });

  it("cancels the pending notice timer on unmount", () => {
    const harness = afterDrillExit();

    harness.unmount();
    jest.useRealTimers();

    expect(harness.result.current.freshHandNoticeShown).toBe(true);
  });
});
