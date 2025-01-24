import { CARDS, Card } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { compareByExpectedScoreDescending } from "./compareByExpectedScoreDescending";
import { expectedHandPoints } from "../game/expectedHandPoints";

describe("compareByExpectedScoreDescending", () => {
  function expectCompareByExpectedScoreDescending(
    card1: Card,
    card2: Card,
  ): number {
    return compareByExpectedScoreDescending(
      {
        discard: [card2],
        expectedHandPoints: expectedHandPoints([card1], [card2]).total,
        handPoints: 0,
        keep: [card1],
      },
      {
        discard: [card1],
        expectedHandPoints: expectedHandPoints([card2], [card1]).total,
        handPoints: 0,
        keep: [card2],
      },
    );
  }

  it("sorts unequal expected hands points hands descending by expected hand points", () =>
    expect(
      expectCompareByExpectedScoreDescending(CARDS.FIVE, CARDS.ACE),
    ).toBeLessThan(0));

  it("sorts equal valued hands by highest index descending", () =>
    expect(
      expectCompareByExpectedScoreDescending(CARDS.ACE, CARDS.TWO),
    ).toBeGreaterThan(0));

  it("sorts equal valued equal highest index hands by second highest index descending", () => {
    const keep1 = [CARDS.FIVE, CARDS.ACE];
    const discard1 = [CARDS.TWO];
    const keep2 = [CARDS.FIVE, CARDS.TWO];
    const discard2 = [CARDS.ACE];

    expect(
      compareByExpectedScoreDescending(
        {
          discard: discard1,
          expectedHandPoints: expectedHandPoints(keep1, discard1).total,
          handPoints: 0,
          keep: keep1,
        },
        {
          discard: discard2,
          expectedHandPoints: expectedHandPoints(keep2, discard2).total,
          handPoints: 0,
          keep: keep2,
        },
      ),
    ).toBeGreaterThan(0);
  });

  it.todo(
    "sorts equal valued equal highest two indices hands by third highest index descending",
  );

  it.todo(
    "sorts equal valued equal highest three indices hands by fourth highest index descending",
  );
});
