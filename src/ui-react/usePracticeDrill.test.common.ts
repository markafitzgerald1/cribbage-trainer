/* jscpd:ignore-start */
import {
  type PracticeDrill,
  type PracticeDrillHand,
  type PracticeDrillPhase,
  type PracticeVerdict,
  usePracticeDrill,
} from "./usePracticeDrill";
import { act, renderHook } from "@testing-library/react";
import {
  clearDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
} from "../ui/discardTally";
import { expect, jest } from "@jest/globals";
import {
  permuteCardSuits,
  suitPermutationForAttempt,
} from "../game/suitPermutation";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import type { MistakeQueueItem } from "../ui/mistakeQueue";
import type { RenderedAnalysis } from "./useDiscardTelemetry";
import { mockItemA } from "../ui/mistakeQueue.test.common";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

export const HAND_KEY = mockItemA.handKey;

/*
 * `Harness.start` defaults to drilling the literal `mockItemA` fixture below
 * (a test can pass another item instead, as the "no previous discard" case
 * in usePracticeDrill.test.ts does with `mockItemB`), so every board state
 * representing "the drill's own hand is on screen" for the default case must
 * be built from the same permutation `beginWith` derives for that item —
 * its fixed handKey and attempts — rather than mockItemA's stored
 * (unpermuted) suits. A test that drills a different item must derive its
 * own permutation from that item's handKey and attempts the same way.
 */
const DRILL_PERMUTATION = suitPermutationForAttempt(
  mockItemA.handKey,
  mockItemA.attempts,
);
export const asDrillCards = (hand: string) =>
  permuteCardSuits(parseHand(hand), DRILL_PERMUTATION);

export const dealtCards = toDealtCards(
  asDrillCards("5H,6H,7H,8H,9H,10H"),
  asDrillCards("5H,6H"),
);

export const analysisOf = (
  isOptimal: boolean,
  expectedPointsLoss: number,
): RenderedAnalysis => ({
  cribRole: CribRole.Dealer,
  quality: { expectedPointsLoss, isOptimal },
});

export const NO_QUALITY: RenderedAnalysis = {
  cribRole: CribRole.Dealer,
  quality: null,
};

export const seedMistake = (handKey = HAND_KEY, discardKey = "5H,6H") =>
  recordDiscardDecision({
    at: Date.now(),
    cribRole: CribRole.Dealer,
    discardKey,
    expectedPointsLoss: 1.5,
    handKey,
    isOptimal: false,
    isPractice: false,
  });

export const OTHER_KEY = "2C,3D,4S,5H,6C,7D|Pone";

export const masterSeededHand = () => {
  seedMistake();
  recordPracticeAttempt({ at: Date.now(), handKey: HAND_KEY, isOptimal: true });
  recordPracticeAttempt({
    at: Date.now() + 1,
    handKey: HAND_KEY,
    isOptimal: true,
  });
};

export interface Harness {
  readonly auto: () => void;
  readonly clear: () => void;
  readonly commit: () => void;
  readonly dealFreshHandCalls: number;
  readonly drill: () => PracticeDrill;
  readonly exit: () => void;
  readonly forwardedAnalyses: readonly RenderedAnalysis[];
  readonly loadedHands: readonly PracticeDrillHand[];
  readonly loadHandCalls: number;
  readonly next: () => void;
  readonly render: (analysis: RenderedAnalysis) => void;
  readonly replaceBoard: (props: BoardProps) => void;
  readonly start: (item?: MistakeQueueItem) => void;
}

export interface BoardProps {
  readonly cards: readonly DealtCard[];
  readonly role: CribRole;
}

export const OTHER_HAND = toDealtCards(parseHand("2C,3D,4S,5H,6C,7D"), []);
export const DRILL_ROLE = mockItemA.cribRole;

export const setupHarness = ({ followLoadedHand = false } = {}): Harness => {
  const loadedHands: PracticeDrillHand[] = [];
  const forwardedAnalyses: RenderedAnalysis[] = [];
  // Trainer's real loadHand swaps the board to the drilled hand; opt in when a test needs that follow-through (a Draw-another to different cards).
  const boardControls: { rerender?: (props: BoardProps) => void } = {};
  const loadHand = jest.fn<(hand: PracticeDrillHand) => void>((hand) => {
    loadedHands.push(hand);
    if (followLoadedHand) {
      boardControls.rerender?.({
        cards: hand.dealtCards,
        role: hand.cribRole,
      });
    }
  });
  const dealFreshHand = jest.fn<() => void>();
  const { rerender, result } = renderHook<PracticeDrill, BoardProps>(
    ({ cards, role }) =>
      usePracticeDrill({
        cribRole: role,
        dealFreshHand,
        dealtCards: cards,
        generateRandomNumber: () => 0,
        loadHand,
        onAnalysisRendered: (analysis) => forwardedAnalyses.push(analysis),
      }),
    { initialProps: { cards: dealtCards, role: DRILL_ROLE } },
  );
  boardControls.rerender = rerender;
  const step = (action: (drill: PracticeDrill) => void) => {
    act(() => {
      action(result.current);
    });
  };
  return {
    auto: () => step((drill) => drill.handleStartAutoDrill()),
    clear: () => step((drill) => drill.clearDrill()),
    commit: () => step((drill) => drill.onCommit()),
    get dealFreshHandCalls() {
      return dealFreshHand.mock.calls.length;
    },
    drill: () => result.current,
    exit: () => step((drill) => drill.onExit()),
    get forwardedAnalyses() {
      return forwardedAnalyses;
    },
    get loadHandCalls() {
      return loadHand.mock.calls.length;
    },
    get loadedHands() {
      return loadedHands;
    },
    next: () => step((drill) => drill.onNextHand()),
    render: (analysis) =>
      step((drill) => drill.handleAnalysisRendered(analysis)),
    replaceBoard: (props) => {
      act(() => {
        rerender(props);
      });
    },
    start: (item = mockItemA) => step((drill) => drill.handleStartDrill(item)),
  };
};

export const freshHarness = ({ seed = false } = {}): Harness => {
  clearDiscardTally();
  if (seed) {
    seedMistake();
  }
  return setupHarness();
};

export const committedHarness = (): Harness => {
  const harness = freshHarness({ seed: true });
  harness.start();
  harness.commit();
  return harness;
};

export const drillAndScore = (harness: Harness, analysis: RenderedAnalysis) => {
  harness.start();
  harness.commit();
  harness.render(analysis);
};

export const drilledThrough = (analysis: RenderedAnalysis): Harness => {
  const harness = freshHarness({ seed: true });
  drillAndScore(harness, analysis);
  return harness;
};

export const scoredOptimalVerdict = (
  harness: Harness,
): PracticeVerdict | null => {
  drillAndScore(harness, analysisOf(true, 0));
  return harness.drill().verdict;
};

export const SAME_CARDS = toDealtCards(asDrillCards("5H,6H,7H,8H,9H,10H"), []);

// A drill committed while `board` sits on screen in place of the drilled hand.
export const drilledOnBoard = (board: BoardProps): Harness => {
  const harness = committedHarness();
  harness.replaceBoard(board);
  harness.render(analysisOf(false, 0.5));
  return harness;
};

export const expectDrillState = (
  harness: Harness,
  active: boolean,
  phase: PracticeDrillPhase,
) => {
  expect(harness.drill().isActive).toBe(active);
  expect(harness.drill().phase).toBe(phase);
};

export const expectNoVerdictRecorded = (harness: Harness) => {
  expect(harness.drill().verdict).toBeNull();
  expect(readTallyForDisplay().practice).toHaveLength(0);
};

export const expectDrillFinished = (harness: Harness) => {
  expectDrillState(harness, false, "choosing");

  expect(harness.drill().verdict).toBeNull();
};

export const expectNoDrillStarted = (harness: Harness) => {
  expect(harness.drill().isActive).toBe(false);
  expect(harness.loadHandCalls).toBe(0);
  expect(harness.dealFreshHandCalls).toBe(0);
};

export const startedThenNext = (
  options: { readonly followLoadedHand?: boolean } = {},
): Harness => {
  const harness = setupHarness(options);
  harness.start();
  harness.next();
  return harness;
};
