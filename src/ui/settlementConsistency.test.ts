import {
  AT,
  decisionOf,
  firstStoredAdmission,
  noiseAdmission,
  noiseJudgedSuccess,
} from "./discardTally.test.common";
import {
  clearDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
} from "./discardTally";
import { describe, expect, it } from "@jest/globals";
import type { DiscardDecisionRecord } from "./discardDecisionRecord";

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

    expect(firstStoredAdmission()).toBe("pending");
  });
});

describe("a practice attempt whose detail contradicts it", () => {
  it("does not count toward mastery when the detail names another loss", () => {
    clearDiscardTally();
    recordPracticeAttempt(noiseJudgedSuccess(2, 0.5));

    expect(readTallyForDisplay().practice).toStrictEqual([]);
  });
});
