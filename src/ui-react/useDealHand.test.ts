import { type DealHand, type DealState, useDealHand } from "./useDealHand";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import type { DealtCard } from "../game/DealtCard";
import type { ReportHandReplaced } from "./useAnalysisReporting";

const FRESH_HAND_NOTICE_MS = 3000;
const INITIAL_BOARD: readonly DealtCard[] = [];

interface Harness {
  readonly dealStates: DealState[];
  readonly markHistoryUpdateCalls: number;
  readonly reportHandReplacedCalls: Parameters<ReportHandReplaced>[];
  readonly replaceBoard: (dealtCards: readonly DealtCard[]) => void;
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
  let syncBoard: (dealtCards: readonly DealtCard[]) => void = () => {
    // Replaced with renderHook's rerender once it exists.
  };
  const { rerender, result, unmount } = renderHook(
    (dealtCards: readonly DealtCard[]) =>
      useDealHand({
        dealtCards,
        generateRandomNumber: () => 0,
        markHistoryUpdate,
        reportHandReplaced,
        // Mirror Trainer: a new DealState becomes the next rendered board.
        setDealState: (state) => {
          dealStates.push(state);
          syncBoard(state.dealtCards);
        },
      }),
    { initialProps: INITIAL_BOARD },
  );
  syncBoard = rerender;
  return {
    dealStates,
    get markHistoryUpdateCalls() {
      return markHistoryUpdate.mock.calls.length;
    },
    replaceBoard: rerender,
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

const advanceTime = (ms: number) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

const expectNoticeShown = (harness: Harness, shown: boolean) => {
  jest.useRealTimers();

  expect(harness.result.current.freshHandNoticeShown).toBe(shown);
};

const expectNoticeClearsAfterWindow = (harness: Harness) => {
  advanceTime(FRESH_HAND_NOTICE_MS);
  expectNoticeShown(harness, false);
};

const expectNoticeStillShown = (harness: Harness) => {
  expectNoticeShown(harness, true);
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

    expectNoticeClearsAfterWindow(harness);
  });

  it("re-arms the notice timer when a second exit lands before the first clears", () => {
    const harness = afterDrillExit();
    const NEARLY_ELAPSED_MS = FRESH_HAND_NOTICE_MS - 1000;

    advanceTime(NEARLY_ELAPSED_MS);
    act(() => {
      harness.result.current.dealForDrillExit();
    });
    // The first exit's 3s timer elapses across this advance; without the re-arm the notice would be gone.
    advanceTime(1000);

    expectNoticeStillShown(harness);
  });

  /*
   * An unmount with the 3s notice timer still pending runs the effect
   * cleanup; the assertion is only that nothing throws and the last
   * rendered value is intact, not that a later fire was suppressed —
   * React 18 no longer warns on a setState after the tree is gone, so
   * that is not observable from here.
   */
  it("survives an unmount while the notice timer is still pending", () => {
    const harness = afterDrillExit();

    harness.unmount();

    expectNoticeStillShown(harness);
  });

  it("retracts the notice when the board is replaced without a fresh deal", () => {
    const harness = afterDrillExit();

    expect(harness.result.current.freshHandNoticeShown).toBe(true);

    // A Back or an Enter-cards hand swaps the board reference outside `deal`.
    act(() => {
      harness.replaceBoard([]);
    });

    expectNoticeShown(harness, false);
  });
});
