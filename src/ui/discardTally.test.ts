import { AT, EMPTY, decisionOf, summaryOf } from "./discardTally.test.common";
import {
  clearDiscardTally,
  readDiscardTally,
  recordDiscardDecision,
} from "./discardTally";
import { describe, expect, it } from "@jest/globals";

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
   * Back, Forward, a re-sort and a reload all re-render a completed discard.
   * Each arrives as the same hand and must move the tally exactly once.
   */
  it("counts a hand's decision once however often it is re-reported", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf({ expectedPointsLoss: 3 }));

    expect(
      recordDiscardDecision(decisionOf({ expectedPointsLoss: 3 })),
    ).toStrictEqual(summaryOf(1, 3, 0));
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
