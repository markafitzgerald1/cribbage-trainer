import {
  AT,
  EMPTY,
  decisionOf,
  storedRecords,
  summaryOf,
} from "./discardTally.test.common";
import {
  type DiscardDecisionRecord,
  clearDiscardTally,
  readDiscardTally,
  recordDiscardDecision,
} from "./discardTally";
import { describe, expect, it } from "@jest/globals";

const AUTHENTIC = { expectedPointsLoss: 2 };
const PRACTICE = { expectedPointsLoss: 9, isPractice: true };

const afterTwoDecisions = (
  first: Partial<DiscardDecisionRecord>,
  second: Partial<DiscardDecisionRecord>,
) => {
  clearDiscardTally();
  recordDiscardDecision(decisionOf(first));
  const summary = recordDiscardDecision(decisionOf(second));
  return { records: storedRecords().length, summary };
};

describe("discard tally storage", () => {
  it("reads a browser with no history as empty", () => {
    clearDiscardTally();

    expect(readDiscardTally(AT)).toStrictEqual(EMPTY);
  });

  it("records the first authentic decision", () => {
    clearDiscardTally();

    expect(recordDiscardDecision(decisionOf())).toStrictEqual(
      summaryOf(1, 1.5, 0),
    );
  });

  it("counts an optimal decision without adding to the loss", () => {
    clearDiscardTally();
    recordDiscardDecision(
      decisionOf({ expectedPointsLoss: 0, isOptimal: true }),
    );

    expect(readDiscardTally(AT)).toStrictEqual(summaryOf(1, 0, 1));
  });

  it("averages across decisions", () => {
    clearDiscardTally();
    recordDiscardDecision(
      decisionOf({ expectedPointsLoss: 1, handKey: "first" }),
    );

    expect(
      recordDiscardDecision(
        decisionOf({ expectedPointsLoss: 2, handKey: "second" }),
      ),
    ).toStrictEqual(summaryOf(2, 1.5, 0));
  });

  // Practice is kept as a record but must not move the headline, which is the point of separating them.
  it("keeps a practice decision out of the average", () => {
    clearDiscardTally();
    recordDiscardDecision(
      decisionOf({ expectedPointsLoss: 4, handKey: "played" }),
    );

    expect(
      recordDiscardDecision(
        decisionOf({
          expectedPointsLoss: 99,
          handKey: "studied",
          isPractice: true,
        }),
      ),
    ).toStrictEqual(summaryOf(1, 4, 0));
  });

  /*
   * All four directions of the idempotency match, because only three of them
   * collapse. Back, Forward, a re-sort and a reload all re-render a completed
   * discard, and each must move the tally exactly once — but a practice row
   * must not own a hand's key against a later authentic deal of those six
   * cards in that order and role (#830), while a practice decision must still
   * fold into the record of the hand being practiced (#809). Asserted on the
   * stored record count as well as the summary, since practice moves no
   * headline figure and an absorbed practice decision is otherwise
   * indistinguishable from a recorded one.
   */
  it.each([
    {
      first: PRACTICE,
      name: "records an authentic decision whose key a practice row holds",
      records: 2,
      second: AUTHENTIC,
      summary: summaryOf(1, 2, 0),
    },
    {
      first: AUTHENTIC,
      name: "absorbs a practice decision into that hand's authentic record",
      records: 1,
      second: PRACTICE,
      summary: summaryOf(1, 2, 0),
    },
    {
      first: PRACTICE,
      name: "absorbs a practice decision into a practice record of that hand",
      records: 1,
      second: { expectedPointsLoss: 1, isPractice: true },
      summary: EMPTY,
    },
    {
      first: AUTHENTIC,
      name: "absorbs a re-reported authentic decision into its own record",
      records: 1,
      second: { expectedPointsLoss: 0, isOptimal: true },
      summary: summaryOf(1, 2, 0),
    },
  ])("$name", ({ first, records, second, summary }) => {
    expect(afterTwoDecisions(first, second)).toStrictEqual({
      records,
      summary,
    });
  });

  /*
   * The practice row now sits ahead of the authentic one in the records, so
   * the match has to keep looking past a row it cannot absorb into rather
   * than stopping at the first row carrying the key.
   */
  it("counts a reloaded authentic decision once behind a practice row", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf(PRACTICE));
    recordDiscardDecision(decisionOf(AUTHENTIC));

    expect(recordDiscardDecision(decisionOf(AUTHENTIC))).toStrictEqual(
      summaryOf(1, 2, 0),
    );
  });

  // A second discard from the same hand is chosen after reading the ranked table, so it is not a fresh instinct.
  it("ignores a changed mind about the same hand", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf({ expectedPointsLoss: 5 }));

    expect(
      recordDiscardDecision(
        decisionOf({ expectedPointsLoss: 0, isOptimal: true }),
      ).meanExpectedPointsLoss,
    ).toBe(5);
  });

  it("reads back a tally written by an earlier session", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf({ expectedPointsLoss: 2.5 }));

    expect(readDiscardTally(AT).meanExpectedPointsLoss).toBe(2.5);
  });
});
