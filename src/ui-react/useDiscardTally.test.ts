import { type DiscardTally, useDiscardTally } from "./useDiscardTally";
import type {
  HandReplacementCause,
  RenderedAnalysis,
} from "./useDiscardTelemetry";
import { act, renderHook } from "@testing-library/react";
import { clearDiscardTally, readDiscardTally } from "../ui/discardTally";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";

const HAND = "AH,2H,3H,4H,5H,6H";
const OTHER_HAND = "7S,8S,9S,10S,JS,QS";

// Each hand discards its own first two cards, so every dealt set is consistent and no lookup can miss.
const discardFor = (hand: string) => (hand === HAND ? "AH,2H" : "7S,8S");

const handOf = (hand: string) =>
  toDealtCards(parseHand(hand), parseHand(discardFor(hand)));

const scoredAnalysis: RenderedAnalysis = {
  cribRole: CribRole.Dealer,
  quality: { expectedPointsLoss: 2, isOptimal: false },
};

// Reporting a score sets state, so every call goes through act rather than each test remembering to.
const reportScore = (
  tally: DiscardTally,
  analysis: RenderedAnalysis = scoredAnalysis,
) => {
  act(() => {
    tally.reportAnalysisRendered(analysis);
  });
};

const noteOrigin = (
  tally: DiscardTally,
  hand: string,
  cause: HandReplacementCause,
) => {
  act(() => {
    tally.reportHandOrigin(handOf(hand), cause, CribRole.Dealer);
  });
};

const renderTally = (
  hand: string,
  { isSeededSession = false, wasDeepLinked = false } = {},
) => {
  clearDiscardTally();
  return renderHook(() =>
    useDiscardTally({
      cribRole: CribRole.Dealer,
      dealtCards: handOf(hand),
      isSeededSession,
      wasDeepLinked,
    }),
  );
};

const replacedBy = (
  hand: string,
  cause: HandReplacementCause,
  options?: { readonly isSeededSession: boolean },
) => {
  const rendered = renderTally(hand, options);
  noteOrigin(rendered.result.current, hand, cause);
  return rendered;
};

const startWithUnknownOrigin = () => {
  const rendered = renderHook(
    ({ hand }: { hand: string }) =>
      useDiscardTally({
        cribRole: CribRole.Dealer,
        dealtCards: handOf(hand),
        isSeededSession: false,
        wasDeepLinked: false,
      }),
    { initialProps: { hand: HAND } },
  );
  clearDiscardTally();
  rendered.rerender({ hand: OTHER_HAND });
  return rendered;
};

const reportScoreTimes = (tally: DiscardTally, times: number) => {
  [...Array(times).keys()].forEach(() => {
    reportScore(tally);
  });
};

describe("discard tally hook", () => {
  /*
   * One table because every case is the same question — does this decision
   * reach the headline average — and separate bodies for it were identical
   * enough to be duplication. What varies is where the hand came from and
   * how often its score is reported, so that is what the table carries.
   */
  it.each([
    {
      counted: 1,
      name: "a hand dealt in an ordinary session",
      reports: 1,
      start: () => renderTally(HAND),
    },
    // Back, Forward and a re-sort all re-report the same completed discard.
    {
      counted: 1,
      name: "one hand however often its score arrives",
      reports: 4,
      start: () => renderTally(HAND),
    },
    {
      counted: 0,
      name: "the hand a seeded session starts with",
      reports: 1,
      start: () => renderTally(HAND, { isSeededSession: true }),
    },
    {
      counted: 0,
      name: "the hand a deep link starts with",
      reports: 1,
      start: () => renderTally(HAND, { wasDeepLinked: true }),
    },
    {
      counted: 0,
      name: "a hand entered by hand",
      reports: 1,
      start: () => replacedBy(OTHER_HAND, "manual"),
    },
    {
      counted: 0,
      name: "a deal inside a seeded session",
      reports: 1,
      start: () => replacedBy(HAND, "deal", { isSeededSession: true }),
    },
    {
      counted: 1,
      name: "a hand dealt after a manual one",
      reports: 1,
      start: () => replacedBy(OTHER_HAND, "deal"),
    },
    /*
     * A hand this session never dealt can only have arrived from a history
     * entry that outlived a page load, and nothing here can vouch for where
     * those cards came from.
     */
    {
      counted: 0,
      name: "a hand of unknown origin",
      reports: 1,
      start: startWithUnknownOrigin,
    },
  ])("counts $counted decisions for $name", ({ counted, reports, start }) => {
    const { result } = start();
    reportScoreTimes(result.current, reports);

    expect(readDiscardTally(Date.now()).decisions).toBe(counted);
  });

  /*
   * Provenance is keyed by the same cards-and-role identity the record uses.
   * Keying it on cards alone let a hand re-entered under the other role mark
   * the dealt hand as practice, so its decision was recorded and then left
   * out of every figure shown.
   */
  it("keeps a dealt hand authentic when the other role is studied", () => {
    const { result } = renderTally(HAND);
    act(() => {
      result.current.reportHandOrigin(handOf(HAND), "manual", CribRole.Pone);
    });
    reportScore(result.current);

    expect(readDiscardTally(Date.now()).decisions).toBe(1);
  });

  /*
   * Dealing away from a hand that was never scored is the whole point of the
   * skip count: without it, abandoning the hands a player finds hard would
   * quietly improve every figure above. What must not count is a hand nobody
   * chose — the one a page load deals — or one entered to study, which is
   * already outside the averages and would otherwise be penalized twice.
   */
  it.each([
    {
      name: "a hand dealt and then left",
      open: (tally: DiscardTally) => {
        noteOrigin(tally, HAND, "deal");
      },
      skipped: 1,
    },
    {
      name: "a hand whose decision was scored",
      open: (tally: DiscardTally) => {
        noteOrigin(tally, HAND, "deal");
        reportScore(tally);
      },
      skipped: 0,
    },
    {
      name: "the hand a page load starts with",
      open: () => {
        // Nothing: the hand a page load deals is the one under test.
      },
      skipped: 0,
    },
    {
      name: "a hand entered to study",
      open: (tally: DiscardTally) => {
        noteOrigin(tally, HAND, "manual");
      },
      skipped: 0,
    },
  ])("counts $skipped skips for $name", ({ open, skipped }) => {
    const { result } = renderTally(HAND);
    open(result.current);
    noteOrigin(result.current, OTHER_HAND, "deal");

    expect(readDiscardTally(Date.now()).skippedHands).toBe(skipped);
  });

  it("records nothing until a discard has been scored", () => {
    const { result } = renderTally(HAND);
    reportScore(result.current, { cribRole: CribRole.Dealer, quality: null });

    expect(readDiscardTally(Date.now())).toStrictEqual({
      decisions: 0,
      meanExpectedPointsLoss: null,
      optimalDecisions: 0,
      skippedHands: 0,
      todayDecisions: 0,
      todayMeanExpectedPointsLoss: null,
      todayOptimalDecisions: 0,
      todaySkippedHands: 0,
    });
  });

  it("averages what the counted decisions cost", () => {
    const { result } = renderTally(HAND);
    reportScore(result.current);

    expect(readDiscardTally(Date.now()).meanExpectedPointsLoss).toBe(2);
  });
});
