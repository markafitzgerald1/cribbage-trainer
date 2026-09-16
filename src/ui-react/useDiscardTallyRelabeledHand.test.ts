import type { DiscardTally, DisplayedHandRelabeling } from "./useDiscardTally";
import {
  HAND,
  noteOriginOfCards,
  renderTallyWithMutableCards,
  reportScore,
} from "./useDiscardTally.test.common";
import { Suit, parseHand } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { readTallyForDisplay, recordDiscardDecision } from "../ui/discardTally";
import { CribRole } from "../game/expectedCribPoints";
import type { RenderedAnalysis } from "./useDiscardTelemetry";
import { permuteCardSuits } from "../game/suitPermutation";
import { toDealtCards } from "../game/toDealtCards";

/*
 * What a practice drill does to a stored mistake before putting it on screen:
 * a global renaming of all four suits, stated in SUITS order, so clubs are
 * shown as hearts, diamonds as spades, hearts as clubs, spades as diamonds.
 * HAND is all hearts, so the board below is the same six ranks in clubs.
 */
const RELABELING: DisplayedHandRelabeling = [
  Suit.HEARTS,
  Suit.SPADES,
  Suit.CLUBS,
  Suit.DIAMONDS,
];

const HAND_KEY = `${HAND}|${CribRole.Dealer}`;
const DISCARD = "AH,2H";

const relabeled = (hand: string) =>
  permuteCardSuits(parseHand(hand), RELABELING);

const relabeledBoard = () => toDealtCards(relabeled(HAND), relabeled(DISCARD));

const storedRecords = () => readTallyForDisplay().records;

const scoredAnalysis = (): RenderedAnalysis => ({
  cribRole: CribRole.Dealer,
  quality: { expectedPointsLoss: 2, isOptimal: false },
});

const seedAuthenticDecision = () => {
  recordDiscardDecision({
    at: Date.now(),
    cribRole: CribRole.Dealer,
    discardKey: DISCARD,
    expectedPointsLoss: 1.5,
    handKey: HAND_KEY,
    isOptimal: false,
    isPractice: false,
  });
};

const practiceFlags = () => storedRecords().map((record) => record.isPractice);

const scoreAsRelabeled = (tally: DiscardTally) => {
  reportScore(tally, scoredAnalysis(), RELABELING);
};

const scoreRelabeledBoard = ({ seedFirst = false } = {}) => {
  const { result } = renderTallyWithMutableCards(relabeledBoard());
  if (seedFirst) {
    seedAuthenticDecision();
  }
  scoreAsRelabeled(result.current);
};

/*
 * The board arrives at the stand-in the way a drill gets there: from the hand
 * it relabels, already recorded as authentic, replaced by a manual load.
 */
const scoreRelabeledBoardLoadedOverItsOwnHand = () => {
  const board = relabeledBoard();
  const { rerender, result } = renderTallyWithMutableCards(
    toDealtCards(parseHand(HAND), parseHand(DISCARD)),
  );
  noteOriginOfCards(result.current, board, "manual");
  rerender({ dealtCards: board });
  scoreAsRelabeled(result.current);
};

describe("a board showing a relabeled stand-in for another hand", () => {
  it("records the decision under the hand it stands in for", () => {
    scoreRelabeledBoard();

    expect(
      storedRecords().map(({ discardKey, handKey }) => ({
        discardKey,
        handKey,
      })),
    ).toStrictEqual([{ discardKey: DISCARD, handKey: HAND_KEY }]);
  });

  /*
   * The defect #809 reports, end to end at this layer: before the relabeling
   * was threaded through, a committed drill attempt derived its key from the
   * relabeled cards, escaped recordDiscardDecision's idempotency, and
   * appended a row naming six cards nobody was dealt — one per distinct
   * relabeling rather than one per attempt, since a hand using few suits
   * exhausts its relabelings and later views reuse an absorbed key.
   */
  it("adds no second row for a hand already recorded", () => {
    scoreRelabeledBoard({ seedFirst: true });

    expect(practiceFlags()).toStrictEqual([false]);
  });

  /*
   * Provenance is still the board's own question. The hand this stand-in
   * relabels was dealt authentically, so looking provenance up by the
   * canonical key would call a drill of it an authentic decision and let it
   * into the headline averages.
   */
  it("is practice even when the hand it stands in for was dealt", () => {
    scoreRelabeledBoardLoadedOverItsOwnHand();

    expect(practiceFlags()).toStrictEqual([true]);
  });
});
