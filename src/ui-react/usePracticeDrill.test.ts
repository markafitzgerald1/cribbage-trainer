import {
  type PracticeDrill,
  type PracticeDrillHand,
  type PracticeDrillPhase,
  usePracticeDrill,
} from "./usePracticeDrill";
import { act, renderHook } from "@testing-library/react";
import {
  clearDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
} from "../ui/discardTally";
import { describe, expect, it, jest } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import type { RenderedAnalysis } from "./useDiscardTelemetry";
import { mockItemA } from "../ui/mistakeQueue.test.common";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";

const HAND_KEY = mockItemA.handKey;
const dealtCards = toDealtCards(
  parseHand("5H,6H,7H,8H,9H,10H"),
  parseHand("5H,6H"),
);

const analysisOf = (
  isOptimal: boolean,
  expectedPointsLoss: number,
): RenderedAnalysis => ({
  cribRole: CribRole.Dealer,
  quality: { expectedPointsLoss, isOptimal },
});

const NO_QUALITY: RenderedAnalysis = {
  cribRole: CribRole.Dealer,
  quality: null,
};

const seedMistake = () =>
  recordDiscardDecision({
    at: Date.now(),
    cribRole: CribRole.Dealer,
    discardKey: "5H,6H",
    expectedPointsLoss: 1.5,
    handKey: HAND_KEY,
    isOptimal: false,
    isPractice: false,
  });

const masterSeededHand = () => {
  seedMistake();
  recordPracticeAttempt({ at: Date.now(), handKey: HAND_KEY, isOptimal: true });
  recordPracticeAttempt({
    at: Date.now() + 1,
    handKey: HAND_KEY,
    isOptimal: true,
  });
};

interface Harness {
  readonly auto: () => void;
  readonly commit: () => void;
  readonly drill: () => PracticeDrill;
  readonly exit: () => void;
  readonly forwardedAnalyses: readonly RenderedAnalysis[];
  readonly loadedHands: readonly PracticeDrillHand[];
  readonly loadHandCalls: number;
  readonly next: () => void;
  readonly render: (analysis: RenderedAnalysis) => void;
  readonly replaceBoard: (props: BoardProps) => void;
  readonly start: () => void;
}

interface BoardProps {
  readonly cards: readonly DealtCard[];
  readonly role: CribRole;
}

const OTHER_HAND = toDealtCards(parseHand("2C,3D,4S,5H,6C,7D"), []);
const DRILL_ROLE = mockItemA.cribRole;

const setupHarness = (): Harness => {
  const loadedHands: PracticeDrillHand[] = [];
  const forwardedAnalyses: RenderedAnalysis[] = [];
  const loadHand = jest.fn<(hand: PracticeDrillHand) => void>((hand) => {
    loadedHands.push(hand);
  });
  const { rerender, result } = renderHook<PracticeDrill, BoardProps>(
    ({ cards, role }) =>
      usePracticeDrill({
        cribRole: role,
        dealtCards: cards,
        generateRandomNumber: () => 0,
        loadHand,
        onAnalysisRendered: (analysis) => forwardedAnalyses.push(analysis),
      }),
    { initialProps: { cards: dealtCards, role: DRILL_ROLE } },
  );
  const step = (action: (drill: PracticeDrill) => void) => {
    act(() => {
      action(result.current);
    });
  };
  return {
    auto: () => step((drill) => drill.handleStartAutoDrill()),
    commit: () => step((drill) => drill.onCommit()),
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
    start: () => step((drill) => drill.handleStartDrill(mockItemA)),
  };
};

const freshHarness = ({ seed = false } = {}): Harness => {
  clearDiscardTally();
  if (seed) {
    seedMistake();
  }
  return setupHarness();
};

const committedHarness = (): Harness => {
  const harness = freshHarness({ seed: true });
  harness.start();
  harness.commit();
  return harness;
};

const drilledThrough = (analysis: RenderedAnalysis): Harness => {
  const harness = committedHarness();
  harness.render(analysis);
  return harness;
};

const SAME_CARDS = toDealtCards(parseHand("5H,6H,7H,8H,9H,10H"), []);

// A drill committed while `board` sits on screen in place of the drilled hand.
const drilledOnBoard = (board: BoardProps): Harness => {
  const harness = committedHarness();
  harness.replaceBoard(board);
  harness.render(analysisOf(false, 0.5));
  return harness;
};

const expectDrillState = (
  harness: Harness,
  active: boolean,
  phase: PracticeDrillPhase,
) => {
  expect(harness.drill().isActive).toBe(active);
  expect(harness.drill().phase).toBe(phase);
};

const expectNoVerdictRecorded = (harness: Harness) => {
  expect(harness.drill().verdict).toBeNull();
  expect(readTallyForDisplay().practice).toHaveLength(0);
};

const expectDrillFinished = (harness: Harness) => {
  expectDrillState(harness, false, "choosing");

  expect(harness.drill().verdict).toBeNull();
};

describe("usePracticeDrill", () => {
  it("loads a mistake face-up, then reveals the analysis only on commit", () => {
    const harness = freshHarness();

    harness.start();

    expectDrillState(harness, true, "choosing");

    expect(harness.drill().activeItem).toBe(mockItemA);
    expect(harness.loadedHands).toStrictEqual([
      {
        cribRole: CribRole.Dealer,
        dealtCards: expect.arrayContaining([
          expect.objectContaining({ kept: true }),
        ]),
      },
    ]);

    harness.commit();
    expectDrillState(harness, true, "revealed");
  });

  it("forwards every analysis to the caller's own handler", () => {
    const harness = freshHarness();

    harness.render(NO_QUALITY);

    expect(harness.forwardedAnalyses).toStrictEqual([NO_QUALITY]);
  });

  it.each([
    {
      arrange: (harness: Harness) => harness.render(NO_QUALITY),
      name: "the drill is inactive",
    },
    {
      arrange: (harness: Harness) => {
        harness.start();
        harness.render(analysisOf(false, 0.5));
      },
      name: "the choice is not yet committed",
    },
    {
      arrange: (harness: Harness) => {
        harness.start();
        harness.commit();
        harness.render(NO_QUALITY);
      },
      name: "the revealed analysis has no quality",
    },
  ])("records no verdict when $name", ({ arrange }) => {
    const harness = freshHarness({ seed: true });

    arrange(harness);

    expectNoVerdictRecorded(harness);
  });

  it("names the discards on the verdict against the mistake's previous one", () => {
    const { verdict } = drilledThrough(analysisOf(false, 0.4)).drill();

    expect(verdict?.chosenDiscard).toBe("5H,6H");
    expect(verdict?.previousDiscard).toBe(mockItemA.previousDiscard);
    expect(verdict?.previousLoss).toBe(mockItemA.previousDiscardLoss);
  });

  it.each([
    {
      analysis: analysisOf(true, 0),
      name: "an optimal choice",
      streak: 1,
      wrong: 0,
    },
    {
      analysis: analysisOf(false, 0.75),
      name: "a sub-optimal choice",
      streak: 0,
      wrong: 1,
    },
  ])("records $name and reports the streak", ({ analysis, streak, wrong }) => {
    const { verdict } = drilledThrough(analysis).drill();
    const [stored] = readTallyForDisplay().practice;

    expect(verdict?.isOptimal).toBe(analysis.quality?.isOptimal);
    expect(verdict?.chosenLoss).toBe(analysis.quality?.expectedPointsLoss);
    expect(verdict?.consecutiveSuccesses).toBe(streak);
    expect(stored?.wrong).toBe(wrong);
  });

  it("records only once even as the analysis re-renders", () => {
    const harness = drilledThrough(analysisOf(false, 0.5));

    harness.render(analysisOf(false, 0.5));

    const [stored] = readTallyForDisplay().practice;

    expect(stored?.attempts).toBe(1);
  });

  it("clears drill state on exit", () => {
    const harness = drilledThrough(analysisOf(true, 0));

    harness.exit();

    expectDrillFinished(harness);
  });

  it.each([
    { advance: (harness: Harness) => harness.auto(), name: "an auto-draw" },
    { advance: (harness: Harness) => harness.next(), name: "Draw another" },
  ])("keeps drilling on $name while active hands remain", ({ advance }) => {
    const harness = freshHarness({ seed: true });

    harness.start();
    advance(harness);

    expectDrillState(harness, true, "choosing");
  });

  it("does nothing on auto-draw when there are no mistakes", () => {
    const harness = freshHarness();

    harness.auto();

    expect(harness.drill().isActive).toBe(false);
    expect(harness.loadHandCalls).toBe(0);
  });

  it("exits when Draw another finds nothing left to drill", () => {
    clearDiscardTally();
    masterSeededHand();
    const harness = setupHarness();

    harness.start();
    harness.next();

    expect(harness.drill().isActive).toBe(false);
  });

  it("reports whether another active hand is available", () => {
    const harness = freshHarness({ seed: true });

    harness.start();

    expect(harness.drill().hasNextHand).toBe(true);
  });

  it.each([
    { board: { cards: OTHER_HAND, role: DRILL_ROLE }, name: "different cards" },
    {
      board: { cards: SAME_CARDS, role: CribRole.Pone },
      name: "the same cards under the opposite role",
    },
    {
      board: { cards: SAME_CARDS, role: DRILL_ROLE },
      name: "the drilled hand with its checked discard reset by Back",
    },
  ])(
    "reports inactive and records nothing when the board holds $name",
    ({ board }) => {
      const harness = drilledOnBoard(board);

      expect(harness.drill().isActive).toBe(false);

      expectNoVerdictRecorded(harness);
    },
  );

  it("still records after a selection change on the same six cards", () => {
    const harness = drilledOnBoard({
      cards: toDealtCards(parseHand("5H,6H,7H,8H,9H,10H"), parseHand("7H,8H")),
      role: DRILL_ROLE,
    });

    expect(harness.drill().verdict).not.toBeNull();
  });

  it("stays finished after Back reopens a scored discard, even once two cards are chosen again", () => {
    const harness = drilledThrough(analysisOf(false, 0.5));

    // Back restores the drilled six cards with the checked discard cleared.
    harness.replaceBoard({ cards: SAME_CARDS, role: DRILL_ROLE });
    expectDrillFinished(harness);

    // Choosing a fresh discard on the restored hand must not revive the drill.
    harness.replaceBoard({
      cards: toDealtCards(parseHand("5H,6H,7H,8H,9H,10H"), parseHand("9H,10H")),
      role: DRILL_ROLE,
    });
    expectDrillFinished(harness);
  });

  it("records nothing when the analysis was scored for the other role", () => {
    const harness = committedHarness();

    harness.render({
      cribRole: CribRole.Pone,
      quality: { expectedPointsLoss: 0.5, isOptimal: false },
    });

    expectNoVerdictRecorded(harness);
  });
});
