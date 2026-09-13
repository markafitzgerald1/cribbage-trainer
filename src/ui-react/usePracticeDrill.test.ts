/* jscpd:ignore-start */
import {
  DRILL_ROLE,
  HAND_KEY,
  type Harness,
  NO_QUALITY,
  OTHER_HAND,
  OTHER_KEY,
  SAME_CARDS,
  analysisOf,
  asDrillCards,
  committedHarness,
  drilledOnBoard,
  drilledThrough,
  expectDrillFinished,
  expectDrillState,
  expectNoDrillStarted,
  expectNoVerdictRecorded,
  freshHarness,
  masterSeededHand,
  scoredOptimalVerdict,
  seedMistake,
  setupHarness,
  startedHarness,
  startedThenNext,
} from "./usePracticeDrill.test.common";
import {
  clearDiscardTally,
  discardTallyKey,
  readTallyForDisplay,
  recordPracticeAttempt,
} from "../ui/discardTally";
import {
  createMockTally,
  mockItemA,
  mockItemB,
} from "../ui/mistakeQueue.test.common";
import { describe, expect, it } from "@jest/globals";
import {
  permuteCardSuits,
  suitPermutationForAttempt,
} from "../game/suitPermutation";
import { CribRole } from "../game/expectedCribPoints";
import { serializeHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

describe("usePracticeDrill", () => {
  it("loads a mistake face-up, then reveals the analysis only on commit", () => {
    const harness = freshHarness();

    harness.start();

    expectDrillState(harness, true, "choosing");

    expect(harness.drill().activeItem).toBe(mockItemA);
    // Suit-exact: a `toDrillHand` that regressed to mockItemA's own stored (unpermuted) cards would still satisfy a looser shape check here.
    expect(harness.loadedHands).toStrictEqual([
      {
        cribRole: CribRole.Dealer,
        dealtCards: toDealtCards(asDrillCards("5H,6H,7H,8H,9H,10H"), []),
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

  it("names the discards on the verdict against the mistake's previous one, both permuted to match", () => {
    const { verdict } = drilledThrough(analysisOf(false, 0.4)).drill();

    expect(verdict?.chosenDiscard).toBe(serializeHand(asDrillCards("5H,6H")));
    expect(verdict?.previousDiscard).toBe(serializeHand(asDrillCards("5H,6H")));
    expect(verdict?.previousLoss).toBe(mockItemA.previousDiscardLoss);
  });

  it("shows no previous discard when the mistake was never recorded with one", () => {
    clearDiscardTally();
    const harness = setupHarness({ followLoadedHand: true });
    const permutedCards = permuteCardSuits(
      mockItemB.cards,
      suitPermutationForAttempt(
        mockItemB.cards,
        mockItemB.handKey,
        mockItemB.attempts,
      ),
    );

    // FollowLoadedHand syncs the board to mockItemB's own (fully kept) permuted hand; this then picks a discard on it, mirroring a real checkbox choice.
    harness.start(mockItemB);
    harness.replaceBoard({
      cards: toDealtCards(permutedCards, permutedCards.slice(0, 2)),
      role: mockItemB.cribRole,
    });
    harness.commit();
    harness.render(analysisOf(true, 0));

    expect(harness.drill().verdict?.previousDiscard).toBeNull();
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

  it("takes the streak from storage, not the drill's start snapshot", () => {
    const harness = freshHarness({ seed: true });
    // Another tab advances the stored streak after this drill's item was captured at zero.
    recordPracticeAttempt({
      at: Date.now(),
      handKey: HAND_KEY,
      isOptimal: true,
    });

    const verdict = scoredOptimalVerdict(harness);

    expect(verdict?.consecutiveSuccesses).toBe(2);
    expect(verdict?.isMastered).toBe(true);
  });

  it("uses a local streak estimate when a newer-build tally refuses the write", () => {
    const harness = freshHarness({ seed: true });
    // A newer deployment's tally in another tab: recordPracticeAttempt leaves it untouched, so nothing is stored to read back.
    localStorage.setItem(
      discardTallyKey,
      JSON.stringify(createMockTally({ version: 999 })),
    );

    const verdict = scoredOptimalVerdict(harness);

    expect(verdict).not.toBeNull();
    expect(verdict?.consecutiveSuccesses).toBe(1);
  });

  it("records only once even as the analysis re-renders", () => {
    const harness = drilledThrough(analysisOf(false, 0.5));

    harness.render(analysisOf(false, 0.5));

    const [stored] = readTallyForDisplay().practice;

    expect(stored?.attempts).toBe(1);
  });

  it("deals a fresh authentic hand on Exit drill", () => {
    const harness = drilledThrough(analysisOf(true, 0));

    harness.exit();

    expectDrillFinished(harness);

    expect(harness.dealFreshHandCalls).toBe(1);
  });

  it("clears drill state without dealing on a history restore", () => {
    const harness = drilledThrough(analysisOf(true, 0));

    harness.clear();

    expectDrillFinished(harness);

    expect(harness.dealFreshHandCalls).toBe(0);
  });

  /*
   * Guards the seed contract from AGENTS.md's URL analysis state section:
   * starting a specific drill permutes suits from the item's own handKey and
   * attempts, never from the shared generator, so it must never advance the
   * stream a later seeded deal would draw from — while the sampler that
   * picks the *next* hand for Draw another and auto-draw legitimately still
   * does.
   */
  describe("the shared generator stream contract", () => {
    it("never draws when starting a specific drill", () => {
      const harness = freshHarness();

      harness.start();

      expect(harness.generateRandomNumberCalls).toBe(0);
    });

    it("still draws for Draw another", () => {
      const harness = startedHarness();

      harness.next();

      expect(harness.generateRandomNumberCalls).toBeGreaterThan(0);
    });
  });

  describe("drawing the next hand", () => {
    it.each([
      {
        advance: (harness: Harness) => harness.next(),
        name: "Draw another is pressed with no active drill",
        seed: true,
      },
      {
        advance: (harness: Harness) => harness.auto(),
        name: "auto-draw runs with no mistakes recorded",
        seed: false,
      },
    ])("does nothing when $name", ({ advance, seed }) => {
      const harness = freshHarness({ seed });

      advance(harness);

      expectNoDrillStarted(harness);
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

    it("interleaves — Draw another skips the hand just drilled when others are active", () => {
      clearDiscardTally();
      seedMistake();
      seedMistake(OTHER_KEY, "2C,3D");

      const harness = startedThenNext({ followLoadedHand: true });

      expect(harness.drill().activeItem?.handKey).toBe(OTHER_KEY);
    });

    it("exits to a fresh hand when Draw another finds nothing left to drill", () => {
      clearDiscardTally();
      masterSeededHand();

      const harness = startedThenNext();

      expect(harness.drill().isActive).toBe(false);
      expect(harness.dealFreshHandCalls).toBe(1);
    });

    it("reports whether another active hand is available", () => {
      const harness = startedHarness();

      expect(harness.drill().hasNextHand).toBe(true);
    });
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
      cards: toDealtCards(
        asDrillCards("5H,6H,7H,8H,9H,10H"),
        asDrillCards("7H,8H"),
      ),
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
      cards: toDealtCards(
        asDrillCards("5H,6H,7H,8H,9H,10H"),
        asDrillCards("9H,10H"),
      ),
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
