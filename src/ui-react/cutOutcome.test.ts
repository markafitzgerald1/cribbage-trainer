import { type CutOutcomeOption, toCutOutcome } from "./cutOutcome";
import { describe, expect, it } from "@jest/globals";
import type { DealtCard } from "../game/DealtCard";
import { cutForHand } from "../game/cutStarter";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";

const HAND = "KH,QS,10D,9C,6S,5H";
const INDEX_OF_KING = 0;
const INDEX_OF_QUEEN = 1;
const INDEX_OF_SIX = 4;
const INDEX_OF_FIVE = 5;

const EXPECTED_POINTS = { expectedHandPoints: 8, signedExpectedCribPoints: 4 };

const boardDiscarding = (discards: string | null): DealtCard[] =>
  toDealtCards(parseHand(HAND), discards === null ? null : parseHand(discards));

const optionFrom = (
  board: readonly DealtCard[],
  discardIndices: readonly number[],
): CutOutcomeOption => ({
  ...EXPECTED_POINTS,
  discard: board.filter((_, index) => discardIndices.includes(index)),
  keep: board.filter((_, index) => !discardIndices.includes(index)),
});

/*
 * The two candidate options for this hand, built from whichever board is
 * passed in, so the `kept` flags they carry are the ones on screen.
 */
const optionsFor = (board: readonly DealtCard[]) => [
  optionFrom(board, [INDEX_OF_KING, INDEX_OF_QUEEN]),
  optionFrom(board, [INDEX_OF_SIX, INDEX_OF_FIVE]),
];

const outcomeFor = (discards: string | null) => {
  const board = boardDiscarding(discards);
  const options = optionsFor(board);
  return { options, outcome: toCutOutcome(board, options) };
};

describe("toCutOutcome", () => {
  it("derives the same cut the starter module does", () => {
    const board = boardDiscarding("6S,5H");

    expect(toCutOutcome(board, []).cut).toStrictEqual(cutForHand(board));
  });

  it("takes the head of the net-score ordering as the best option", () => {
    const { options, outcome } = outcomeFor("6S,5H");

    expect(outcome.best).toBe(options[0]);
  });

  it("finds the user's own option by its discard", () => {
    const { options, outcome } = outcomeFor("6S,5H");

    expect(outcome.chosen).toBe(options[1]);
  });

  /*
   * A keep-based test would match several options here and name one of them as
   * the user's; a discard-based test matches none, which is what lets the
   * panel stay hidden until a discard is actually complete.
   */
  it("reports no chosen option while the selection is incomplete", () => {
    expect(outcomeFor(null).outcome.chosen).toBeUndefined();
  });

  it("reports no best option before the analysis has scored anything", () => {
    expect(toCutOutcome(boardDiscarding("6S,5H"), []).best).toBeUndefined();
  });
});
