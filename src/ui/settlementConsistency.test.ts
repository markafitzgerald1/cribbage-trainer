import { AT, decisionOf } from "./discardTally.test.common";
import {
  clearDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
} from "./discardTally";
import { describe, expect, it } from "@jest/globals";
import type { DiscardDecisionRecord } from "./discardDecisionRecord";

const noiseAdmission = { basis: "sampling-noise-v1", eligible: false } as const;

describe("a settlement that does not describe the pending decision", () => {
  it.each<{
    readonly name: string;
    readonly settlement: Partial<DiscardDecisionRecord>;
  }>([
    {
      name: "stamped with another moment, as another tab's would be",
      settlement: { at: AT + 100 },
    },
    {
      name: "made by a practice decision",
      settlement: { isPractice: true },
    },
    {
      name: "judging a different loss",
      settlement: { expectedPointsLoss: 2 },
    },
    {
      name: "judging the discard as best",
      settlement: {
        isOptimal: true,
        recordedAdmission: { basis: "exact-v1", eligible: false },
      },
    },
  ])("leaves the row pending when $name", ({ settlement }) => {
    clearDiscardTally();
    const decision = decisionOf({ recordedAdmission: "pending" });
    recordDiscardDecision(decision);
    recordDiscardDecision({
      ...decision,
      recordedAdmission: noiseAdmission,
      ...settlement,
    });

    expect(readTallyForDisplay().records[0]?.recordedAdmission).toBe("pending");
  });
});

describe("a practice attempt whose detail contradicts it", () => {
  it("does not count toward mastery when the detail names another loss", () => {
    clearDiscardTally();
    recordPracticeAttempt({
      at: AT,
      detail: {
        basis: "sampling-noise-v1",
        discardKey: "AH,2H",
        expectedPointsLoss: 0.5,
        isOptimal: false,
        outcome: "success",
        tableIdentity: null,
      },
      expectedPointsLoss: 2,
      handKey: "AH,2H,3H,4H,5H,6H|Dealer",
      isOptimal: false,
    });

    expect(readTallyForDisplay().practice).toStrictEqual([]);
  });
});
