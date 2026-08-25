import { type DiscardTally, useDiscardTally } from "./useDiscardTally";
import type {
  HandReplacementCause,
  RenderedAnalysis,
} from "./useDiscardTelemetry";
import { act, renderHook } from "@testing-library/react";
import { clearDiscardTally, readDiscardTally } from "../ui/discardTally";
import { CribRole } from "../game/expectedCribPoints";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";

export const HAND = "AH,2H,3H,4H,5H,6H";
export const OTHER_HAND = "7S,8S,9S,10S,JS,QS";

// Telemetry's own identifier for the hand a page load starts with. Fixed across tests: each starts from a fresh tally, so nothing shares a hand across them.
export const INITIAL_HAND_ID = "initial-hand-id";

// Each hand discards its own first two cards, so every dealt set is consistent and no lookup can miss.
const discardFor = (hand: string) => (hand === HAND ? "AH,2H" : "7S,8S");

// A hand with its two cards chosen, or one still untouched — which is what separates a decision from a hand walked away from.
export const handOf = (hand: string, discarded = true) =>
  toDealtCards(parseHand(hand), discarded ? parseHand(discardFor(hand)) : null);

const scoredAnalysis: RenderedAnalysis = {
  cribRole: CribRole.Dealer,
  quality: { expectedPointsLoss: 2, isOptimal: false },
};

// Reporting a score sets state, so every call goes through act rather than each test remembering to.
export const reportScore = (
  tally: DiscardTally,
  analysis: RenderedAnalysis = scoredAnalysis,
) => {
  act(() => {
    tally.reportAnalysisRendered(analysis);
  });
};

// Each hand replacement opens its own telemetry scope, so deriving the identifier from the cards keeps every hand distinct without a parameter at each call.
export const scopeFor = (hand: string) => `${hand}-scope`;

export const noteOrigin = (
  tally: DiscardTally,
  hand: string,
  cause: HandReplacementCause,
) => {
  act(() => {
    tally.reportHandOrigin(handOf(hand), cause, {
      cribRole: CribRole.Dealer,
      handId: scopeFor(hand),
    });
  });
};

/*
 * Defaults to restoring the scope the page load opened, which is what a
 * same-hand navigation looks like. Passing another identifier is what
 * separates a genuine restore of a different occurrence of the same cards.
 */
export const noteRestore = (
  tally: DiscardTally,
  hand: string,
  {
    cribRole = CribRole.Dealer,
    handId = INITIAL_HAND_ID,
  }: { cribRole?: CribRole | null; handId?: string | null } = {},
) => {
  act(() => {
    tally.reportHandRestored(handOf(hand), { cribRole, handId });
  });
};

/*
 * Constructed with the dealt cards as a prop the caller can rerender with, for
 * a test that needs the hook's own dealtCards to actually change mid-test --
 * distinct
 * from renderTally, whose hand never moves once rendered.
 */
export const renderTallyWithMutableCards = (
  initialDealtCards: ReturnType<typeof handOf>,
) => {
  clearDiscardTally();
  return renderHook(
    ({ dealtCards }: { dealtCards: ReturnType<typeof handOf> }) =>
      useDiscardTally({
        cribRole: CribRole.Dealer,
        dealtCards,
        initialHandId: INITIAL_HAND_ID,
        isSeededSession: false,
        wasDeepLinked: false,
      }),
    { initialProps: { dealtCards: initialDealtCards } },
  );
};

export const renderTally = (
  hand: string,
  { discarded = true, isSeededSession = false, wasDeepLinked = false } = {},
) => {
  clearDiscardTally();
  return renderHook(() =>
    useDiscardTally({
      cribRole: CribRole.Dealer,
      dealtCards: handOf(hand, discarded),
      initialHandId: INITIAL_HAND_ID,
      isSeededSession,
      wasDeepLinked,
    }),
  );
};

export const replacedBy = (
  hand: string,
  cause: HandReplacementCause,
  options?: { readonly isSeededSession: boolean },
) => {
  const rendered = renderTally(hand, options);
  noteOrigin(rendered.result.current, hand, cause);
  return rendered;
};

export const startWithUnknownOrigin = () => {
  const rendered = renderHook(
    ({ hand }: { hand: string }) =>
      useDiscardTally({
        cribRole: CribRole.Dealer,
        dealtCards: handOf(hand),
        initialHandId: INITIAL_HAND_ID,
        isSeededSession: false,
        wasDeepLinked: false,
      }),
    { initialProps: { hand: HAND } },
  );
  clearDiscardTally();
  rendered.rerender({ hand: OTHER_HAND });
  return rendered;
};

export const reportScoreTimes = (tally: DiscardTally, times: number) => {
  [...Array(times).keys()].forEach(() => {
    reportScore(tally);
  });
};

export const decisionsAndSkips = () => {
  const summary = readDiscardTally(Date.now());
  return [summary.decisions, summary.skippedHands];
};
