/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import { Rank, Suit, createCard } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import type { CutOutcomeOption } from "./cutOutcome";
import { CutOutcomePanel } from "./CutOutcomePanel";
import type { DealtCard } from "../game/DealtCard";
import { SortOrder } from "../ui/SortOrder";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

/*
 * Three fives and a jack, dealt with the two low cards that make the
 * alternative discard. These six cards derive their own cut, so the counts
 * asserted below are whatever that starter produces — see the second describe.
 */
const DEALT = toDealtCards(
  [
    createCard(Rank.FIVE, Suit.CLUBS),
    createCard(Rank.FIVE, Suit.DIAMONDS),
    createCard(Rank.FIVE, Suit.HEARTS),
    createCard(Rank.JACK, Suit.SPADES),
    createCard(Rank.TWO, Suit.CLUBS),
    createCard(Rank.THREE, Suit.DIAMONDS),
  ],
  null,
);

const INDEX_OF_FIRST_FIVE = 0;
const INDEX_OF_SECOND_FIVE = 1;
const INDEX_OF_TWO = 4;
const INDEX_OF_THREE = 5;

interface Choice {
  readonly discardIndices: readonly number[];
  readonly expectedCribPoints: number;
  readonly expectedHandPoints: number;
}

const KEEP_THE_FIVES: Choice = {
  discardIndices: [INDEX_OF_TWO, INDEX_OF_THREE],
  expectedCribPoints: 4,
  expectedHandPoints: 12.5,
};

const THROW_TWO_FIVES: Choice = {
  discardIndices: [INDEX_OF_FIRST_FIVE, INDEX_OF_SECOND_FIVE],
  expectedCribPoints: 6,
  expectedHandPoints: 5.25,
};

/*
 * The board carries the selection, and the scored options are built from that
 * same board: `kept` is what identifies the user's own option, exactly as the
 * analysis produces them from the cards on screen.
 */
const boardDiscarding = (discardIndices: readonly number[]): DealtCard[] =>
  DEALT.map((card, index) => ({
    ...card,
    kept: !discardIndices.includes(index),
  }));

/*
 * The expectation arrives already signed by role — the analysis negates crib
 * points for the pone — so the fixtures sign them too. Leaving them positive
 * would render a pone whose crib counts against them in the count column and
 * for them in the expectation, a state production cannot produce.
 */
const optionFrom = (
  board: readonly DealtCard[],
  choice: Choice,
  cribRole: CribRole,
) => ({
  discard: board.filter((_, index) => choice.discardIndices.includes(index)),
  expectedHandPoints: choice.expectedHandPoints,
  keep: board.filter((_, index) => !choice.discardIndices.includes(index)),
  signedExpectedCribPoints:
    cribRole === CribRole.Dealer
      ? choice.expectedCribPoints
      : -choice.expectedCribPoints,
});

const renderWith = (
  board: readonly DealtCard[],
  options: readonly CutOutcomeOption[],
  cribRole: CribRole = CribRole.Dealer,
) =>
  render(
    <CutOutcomePanel
      cribRole={cribRole}
      dealtCards={board}
      scoredKeepDiscardsByNetScore={options}
      sortOrder={SortOrder.Descending}
    />,
  );

const renderPanel = (
  chosen: Choice,
  best: Choice,
  cribRole: CribRole = CribRole.Dealer,
) => {
  const board = boardDiscarding(chosen.discardIndices);
  return renderWith(
    board,
    chosen === best
      ? [optionFrom(board, chosen, cribRole)]
      : [
          optionFrom(board, best, cribRole),
          optionFrom(board, chosen, cribRole),
        ],
    cribRole,
  );
};

describe("cutOutcomePanel", () => {
  it("names itself so the outcome can be located as a region", () => {
    renderPanel(KEEP_THE_FIVES, THROW_TWO_FIVES);

    expect(
      screen.getByRole("region", { name: "Starter cut outcome" }),
    ).toBeInTheDocument();
  });

  it("shows the top choice beside the user's when they differ", () => {
    renderPanel(THROW_TWO_FIVES, KEEP_THE_FIVES);

    expect(screen.getByText("Yours")).toBeInTheDocument();
    expect(screen.getByText("Top choice")).toBeInTheDocument();
  });

  it("collapses to one row when the user played the top choice", () => {
    renderPanel(KEEP_THE_FIVES, KEEP_THE_FIVES);

    expect(screen.getByText("Yours, the top choice")).toBeInTheDocument();
    expect(screen.queryByText("Top choice")).toBeNull();
  });

  it("frames a single cut as a sample rather than a verdict", () => {
    renderPanel(KEEP_THE_FIVES, THROW_TWO_FIVES);

    expect(screen.getByText("one sample, not a verdict")).toBeInTheDocument();
    // The variance caution itself, which is the half that keeps a losing top choice from reading as a contradiction.
    expect(screen.getByText(/often loses one/u)).toBeInTheDocument();
  });

  /*
   * Avg comes from the vendored crib table, which averages over the
   * simulator's opponent policy, while the count beside it takes two random
   * crib cards. The copy has to say so, or the two columns read as the same
   * quantity measured two ways.
   */
  it("discloses that the count and the expectation model the crib differently", () => {
    renderPanel(KEEP_THE_FIVES, THROW_TWO_FIVES);

    expect(
      screen.getByText(
        /modelled opponent; this crib pairs your discard with two fixed cards/u,
      ),
    ).toBeInTheDocument();
  });

  it("renders nothing while no discard is complete", () => {
    const board = boardDiscarding([]);
    const { container } = renderWith(board, [
      optionFrom(board, KEEP_THE_FIVES, CribRole.Dealer),
    ]);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing before the analysis has scored the alternatives", () => {
    const { container } = renderWith(
      boardDiscarding(KEEP_THE_FIVES.discardIndices),
      [],
    );

    expect(container).toBeEmptyDOMElement();
  });
});

/*
 * These six cards cut the ace of spades (A♠) and send the four and eight of
 * hearts (4♥ 8♥) to the crib, so keeping the fives counts 15 in hand against
 * a crib of 8.
 * Spelled out rather than recomputed here, so a change in the derivation
 * surfaces as a failure instead of as two matching wrong answers.
 */
describe("cutOutcomePanel counts", () => {
  it("counts the kept hand on the derived starter", () => {
    renderPanel(KEEP_THE_FIVES, THROW_TWO_FIVES);

    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("adds the dealer's crib and totals the two", () => {
    renderPanel(KEEP_THE_FIVES, THROW_TWO_FIVES);

    expect(screen.getByText("+8")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
  });

  it("subtracts the pone's crib and totals the two", () => {
    renderPanel(KEEP_THE_FIVES, THROW_TWO_FIVES, CribRole.Pone);

    expect(screen.getByText("−8")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  /*
   * The visual grid is aria-hidden, so this sentence is the only thing a
   * screen reader gets: it has to name every column rather than repeat the
   * numbers the sighted layout already associates by position, and it spells
   * the signs as words because the digit-width minus reads poorly aloud.
   */
  it.each([
    {
      cribRole: CribRole.Dealer,
      name: "a crib the dealer adds",
      summary: "Yours, 3♦ 2♣: hand 15, crib plus 8, total 23, average 16.50",
    },
    {
      cribRole: CribRole.Pone,
      name: "a crib the pone loses",
      summary: "Yours, 3♦ 2♣: hand 15, crib minus 8, total 7, average 8.50",
    },
  ])("spells $name out for assistive technology", ({ cribRole, summary }) => {
    renderPanel(KEEP_THE_FIVES, THROW_TWO_FIVES, cribRole);

    expect(screen.getByText(summary)).toBeInTheDocument();
  });

  /*
   * The top choice's own counts, not just its label: the acceptance criterion
   * this panel exists for is the recommendation's count on the same starter,
   * and every other numeric assertion here reads the user's row.
   */
  it("counts the top choice on the same starter as the user's row", () => {
    renderPanel(THROW_TWO_FIVES, KEEP_THE_FIVES);

    expect(
      screen.getByText(
        "Top choice, 3♦ 2♣: hand 15, crib plus 8, total 23, average 16.50",
      ),
    ).toBeInTheDocument();
  });

  /*
   * The crib's other two cards are what let a reader check its count rather
   * than take it on trust, so their absence has to fail: every other assertion
   * in this file passes with the header's disclosure deleted.
   */
  it("shows the starter and the crib's two sampled cards", () => {
    renderPanel(KEEP_THE_FIVES, THROW_TWO_FIVES);

    const header = screen.getByText("crib also gets").parentElement;

    expect(header?.textContent).toBe(
      "This cutA♠crib also gets8♥4♥one sample, not a verdict",
    );
  });

  it("keeps the expectation beside the count for both rows", () => {
    renderPanel(KEEP_THE_FIVES, THROW_TWO_FIVES);

    expect(screen.getByText("16.50")).toBeInTheDocument();
    expect(screen.getByText("11.25")).toBeInTheDocument();
  });
});
