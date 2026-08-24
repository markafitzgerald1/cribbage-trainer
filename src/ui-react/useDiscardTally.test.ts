import { type DiscardTally, useDiscardTally } from "./useDiscardTally";
import type {
  HandReplacementCause,
  RenderedAnalysis,
} from "./useDiscardTelemetry";
import { act, renderHook } from "@testing-library/react";
import {
  clearDiscardTally,
  readDiscardTally,
  recordDiscardDecision,
} from "../ui/discardTally";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";

const HAND = "AH,2H,3H,4H,5H,6H";
const OTHER_HAND = "7S,8S,9S,10S,JS,QS";

// Each hand discards its own first two cards, so every dealt set is consistent and no lookup can miss.
const discardFor = (hand: string) => (hand === HAND ? "AH,2H" : "7S,8S");

// A hand with its two cards chosen, or one still untouched — which is what separates a decision from a hand walked away from.
const handOf = (hand: string, discarded = true) =>
  toDealtCards(parseHand(hand), discarded ? parseHand(discardFor(hand)) : null);

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

const noteRestore = (
  tally: DiscardTally,
  hand: string,
  cribRole: CribRole | null = CribRole.Dealer,
) => {
  act(() => {
    tally.reportHandRestored(handOf(hand), cribRole);
  });
};

const renderTally = (
  hand: string,
  { discarded = true, isSeededSession = false, wasDeepLinked = false } = {},
) => {
  clearDiscardTally();
  return renderHook(() =>
    useDiscardTally({
      cribRole: CribRole.Dealer,
      dealtCards: handOf(hand, discarded),
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

const decisionsAndSkips = () => {
  const summary = readDiscardTally(Date.now());
  return [summary.decisions, summary.skippedHands];
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
   * Neither disturbs the identity of the hand actually being decided, so
   * scoring it afterward must still land as one authentic decision.
   * Provenance is keyed by the same cards-and-role identity the record uses:
   * keying it on cards alone let a hand re-entered under the other role mark
   * the dealt hand as practice, so its decision was recorded and then left
   * out of every figure shown. A same-hand history restore — a sort-only
   * push, or Back to an earlier state of the hand still open — must not
   * relabel it either; only a restore naming a different hand marks
   * practice.
   */
  it.each([
    {
      name: "the other role is studied",
      perform: (tally: DiscardTally) => {
        act(() => {
          tally.reportHandOrigin(handOf(HAND), "manual", CribRole.Pone);
        });
      },
    },
    {
      name: "a same-hand history restore occurs",
      perform: (tally: DiscardTally) => {
        noteRestore(tally, HAND);
      },
    },
  ])("keeps a dealt hand authentic when $name", ({ perform }) => {
    const { result } = renderTally(HAND);
    perform(result.current);
    reportScore(result.current);

    expect(readDiscardTally(Date.now()).decisions).toBe(1);
  });

  /*
   * Dealing away from a hand that was never scored is the whole point of the
   * skip count: without it, abandoning the hands a player finds hard would
   * quietly improve every figure above. The hand a page load deals counts
   * like any other, because pressing Deal from it is a deliberate walk-away
   * — but a hand entered to study does not, being already outside the
   * averages and otherwise penalized twice.
   */
  it.each([
    {
      name: "a hand left without a discard",
      play: () => {
        // Nothing: the hand a page load deals is the one walked away from.
      },
      skipped: 1,
      start: { discarded: false },
    },
    {
      name: "a hand whose decision was scored",
      play: (tally: DiscardTally) => {
        reportScore(tally);
      },
      skipped: 0,
    },
    /*
     * Scoring waits on the expected-points tables. A discard completed while
     * they are still loading — or after they fail — is a decision the player
     * made, and counting it as avoidance would punish them for the latency.
     */
    {
      name: "a discard completed but never scored",
      play: () => {
        // Nothing: no score arrives, and none is needed.
      },
      skipped: 0,
    },
    {
      name: "a hand entered to study",
      play: (tally: DiscardTally) => {
        reportScore(tally);
        noteOrigin(tally, OTHER_HAND, "manual");
      },
      skipped: 0,
    },
    {
      name: "the hand a seeded session starts with",
      play: () => {
        // Nothing: the seeded start is the hand walked away from.
      },
      skipped: 0,
      start: { discarded: false, isSeededSession: true },
    },
    {
      name: "the hand a deep link starts with",
      play: () => {
        // Nothing: the deep-linked start is the hand walked away from.
      },
      skipped: 0,
      start: { discarded: false, wasDeepLinked: true },
    },
    /*
     * A restore naming no role — a URL entry this build cannot parse one
     * from — must leave the open hand's provenance untouched, or this
     * Deal-away would go uncounted along with it.
     */
    {
      name: "a hand a role-free history restore left untouched",
      play: (tally: DiscardTally) => {
        noteRestore(tally, HAND, null);
      },
      skipped: 1,
      start: { discarded: false },
    },
  ])("counts $skipped skips for $name", ({ play, skipped, start }) => {
    const { result } = renderTally(HAND, start);
    play(result.current);
    noteOrigin(result.current, OTHER_HAND, "deal");

    expect(readDiscardTally(Date.now()).skippedHands).toBe(skipped);
  });

  /*
   * A seeded or deep-linked start is study, so walking away from it is not
   * avoidance. Folded into the table above rather than tested separately,
   * where its body was identical to it.
   */

  /*
   * A tab left open across local midnight would otherwise keep showing
   * yesterday's play under "today". Returning to it recomputes the figures,
   * which also picks up whatever another tab recorded meanwhile — here, a
   * decision written straight to storage behind the hook's back.
   */
  it.each([
    { decisions: 1, name: "the tab is visible again", state: "visible" },
    { decisions: 0, name: "it stays hidden", state: "hidden" },
  ])("refreshes when $name", ({ decisions, state }) => {
    const { result } = renderTally(HAND);
    recordDiscardDecision({
      at: Date.now(),
      cribRole: CribRole.Dealer,
      expectedPointsLoss: 1,
      handKey: "written-elsewhere",
      isOptimal: false,
      isPractice: false,
    });
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: state,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.summary.decisions).toBe(decisions);
  });

  /*
   * A decision already counted must not be charged a skip as well. Taking a
   * card back after deciding — or stepping back to the same hand before its
   * discard — leaves the cards incomplete while the decision stands, and
   * reading the cards alone put one hand in both columns, inflating the
   * denominator the two figures share.
   */
  it("counts no skip for a hand whose discard was later undone", () => {
    clearDiscardTally();
    const { rerender, result } = renderHook(
      ({ discarded }: { discarded: boolean }) =>
        useDiscardTally({
          cribRole: CribRole.Dealer,
          dealtCards: handOf(HAND, discarded),
          isSeededSession: false,
          wasDeepLinked: false,
        }),
      { initialProps: { discarded: true } },
    );
    reportScore(result.current);
    rerender({ discarded: false });
    noteOrigin(result.current, OTHER_HAND, "deal");

    expect(decisionsAndSkips()).toStrictEqual([1, 0]);
  });

  /*
   * A hand history restores after being walked away from must not also count
   * as a decision: Deal already charged it a skip, and scoring its eventual
   * discard would put the same hand in both halves of the denominator they
   * share. Matches telemetry's own rule that a history-restored exposure is
   * never first instinct (skills/analytics-telemetry/SKILL.md's filtering
   * contract): its answers were already revealed, by this same visit.
   */
  it("excludes a decision reached after its hand was restored from history", () => {
    const { result } = renderTally(HAND, { discarded: false });
    noteOrigin(result.current, OTHER_HAND, "deal");
    noteRestore(result.current, HAND);
    reportScore(result.current);

    expect(decisionsAndSkips()).toStrictEqual([0, 1]);
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
