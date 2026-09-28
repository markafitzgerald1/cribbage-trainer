import {
  type DiscardTally,
  type DisplayedHandRelabeling,
  useDiscardTally,
} from "./useDiscardTally";
import type {
  HandReplacementCause,
  RenderedAnalysis,
} from "./useDiscardTelemetry";
import { act, renderHook } from "@testing-library/react";
import { clearDiscardTally, readDiscardTally } from "../ui/discardTally";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { SortOrder } from "../ui/SortOrder";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";

// Matches useSortOrder's own default, since these tests are not about sort order unless they say so.
export const DEFAULT_SORT_ORDER = SortOrder.Descending;

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

/*
 * Reporting a score sets state, so every call goes through act rather than
 * each test remembering to. `displayedAs` is what a practice drill passes to
 * say the board is showing a relabeled stand-in; null is every other caller,
 * which is the default here because it is also the default in the app.
 */
export const reportScore = (
  tally: DiscardTally,
  analysis: RenderedAnalysis = scoredAnalysis,
  displayedAs: DisplayedHandRelabeling | null = null,
) => {
  act(() => {
    tally.reportAnalysisRendered(analysis, displayedAs);
  });
};

// Each hand replacement opens its own telemetry scope, so deriving the identifier from the cards keeps every hand distinct without a parameter at each call.
export const scopeFor = (hand: string) => `${hand}-scope`;

const noteOriginWith = (
  tally: DiscardTally,
  cause: HandReplacementCause,
  { cards, handId }: { cards: readonly DealtCard[]; handId: string },
) => {
  act(() => {
    tally.reportHandOrigin(cards, cause, {
      cribRole: CribRole.Dealer,
      handId,
    });
  });
};

export const noteOrigin = (
  tally: DiscardTally,
  hand: string,
  cause: HandReplacementCause,
) => {
  noteOriginWith(tally, cause, { cards: handOf(hand), handId: scopeFor(hand) });
};

// The same, for a board whose cards no hand string describes — a drill's relabeled stand-in.
export const noteOriginOfCards = (
  tally: DiscardTally,
  cards: readonly DealtCard[],
  cause: HandReplacementCause,
) => {
  noteOriginWith(tally, cause, { cards, handId: "relabeled-hand-scope" });
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
// A named type rather than a literal written at each call site, so renderHook infers one Props type shared by the callback below and every later rerender call, rather than a narrower one from whichever call happens to supply every field.
interface MutableTallyProps {
  readonly dealtCards: ReturnType<typeof handOf>;
  // What telemetry would be reporting for the board: a test that moves to another occurrence passes that occurrence's identifier here as well as to the report.
  readonly handId?: string;
  readonly sortOrder?: SortOrder;
}

/*
 * The sort order can be changed on a later render alongside dealtCards, and
 * defaults so a caller that is not testing sort order at all can leave it
 * off every render. That is what lets a test change the sort order between
 * a discard's completion and its score arriving, without dealtCards moving
 * at the same time (#872).
 */
export const renderTallyWithMutableCards = (
  initialDealtCards: ReturnType<typeof handOf>,
  initialSortOrder: SortOrder = DEFAULT_SORT_ORDER,
  wasDeepLinked = false,
) => {
  clearDiscardTally();
  const initialProps: MutableTallyProps = {
    dealtCards: initialDealtCards,
    sortOrder: initialSortOrder,
  };
  return renderHook(
    ({
      dealtCards,
      handId = INITIAL_HAND_ID,
      sortOrder = DEFAULT_SORT_ORDER,
    }: MutableTallyProps) =>
      useDiscardTally({
        cribRole: CribRole.Dealer,
        dealtCards,
        handId,
        isSeededSession: false,
        sortOrder,
        wasDeepLinked,
      }),
    { initialProps },
  );
};

interface RenderTallyOptions {
  readonly discarded?: boolean;
  readonly isSeededSession?: boolean;
  readonly sortOrder?: SortOrder;
  readonly wasDeepLinked?: boolean;
}

export const renderTally = (
  hand: string,
  {
    discarded = true,
    isSeededSession = false,
    sortOrder = DEFAULT_SORT_ORDER,
    wasDeepLinked = false,
  }: RenderTallyOptions = {},
) => {
  clearDiscardTally();
  return renderHook(() =>
    useDiscardTally({
      cribRole: CribRole.Dealer,
      dealtCards: handOf(hand, discarded),
      handId: INITIAL_HAND_ID,
      isSeededSession,
      sortOrder,
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
        handId: INITIAL_HAND_ID,
        isSeededSession: false,
        sortOrder: DEFAULT_SORT_ORDER,
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
