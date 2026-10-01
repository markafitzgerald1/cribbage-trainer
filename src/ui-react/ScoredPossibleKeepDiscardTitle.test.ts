/* jscpd:ignore-start */
import { describe, expect, it } from "@jest/globals";
import { getRowTitle } from "./ScoredPossibleKeepDiscard";
import { mockTradeOffClassification } from "../ui/mistakeQueue.test.common";
/* jscpd:ignore-end */

describe("getRowTitle", () => {
  it.each([
    {
      expected: "Optimal discard",
      highlightTier: "chosen" as const,
      name: "chosen tier without classification",
      options: {},
    },
    {
      expected:
        "Chosen discard (0.10 pts lost): 1.30 Crib gain does not cover 1.40 Hand loss",
      highlightTier: "chosen" as const,
      name: "chosen tier with classification",
      options: { classification: mockTradeOffClassification },
    },
    {
      expected: "Equal-best discard",
      highlightTier: "equal-best" as const,
      name: "equal-best tier",
      options: {},
    },
    {
      // eslint-disable-next-line no-undefined
      expected: undefined,
      highlightTier: "none" as const,
      name: "none tier",
      options: {},
    },
    {
      expected: "Optimal discard (also earlier drill discard)",
      highlightTier: "chosen" as const,
      name: "chosen tier without classification when earlier choice",
      options: { isEarlierChoice: true },
    },
    {
      expected:
        "Chosen discard (0.10 pts lost, also earlier drill discard): 1.30 Crib gain does not cover 1.40 Hand loss",
      highlightTier: "chosen" as const,
      name: "chosen tier with classification when earlier choice",
      options: {
        classification: mockTradeOffClassification,
        isEarlierChoice: true,
      },
    },
    {
      expected: "Equal-best discard (also earlier drill discard)",
      highlightTier: "equal-best" as const,
      name: "equal-best tier when earlier choice",
      options: { isEarlierChoice: true },
    },
    {
      expected: "Earlier drill discard",
      highlightTier: "none" as const,
      name: "none tier when earlier choice",
      options: { isEarlierChoice: true },
    },
    {
      expected:
        "Chosen discard (0.10 pts lost, within simulation noise, approximate): 1.30 Crib gain does not cover 1.40 Hand loss",
      highlightTier: "chosen" as const,
      name: "chosen tier with classification and within noise",
      options: {
        classification: mockTradeOffClassification,
        isWithinNoise: true,
      },
    },
    {
      expected:
        "Chosen discard (0.10 pts lost, within simulation noise, approximate, also earlier drill discard): 1.30 Crib gain does not cover 1.40 Hand loss",
      highlightTier: "chosen" as const,
      name: "chosen tier with classification, within noise, and earlier choice",
      options: {
        classification: mockTradeOffClassification,
        isEarlierChoice: true,
        isWithinNoise: true,
      },
    },
  ])("computes row title for $name", ({ expected, highlightTier, options }) => {
    expect(getRowTitle(highlightTier, options)).toBe(expected);
  });

  it("computes row title with default parameters", () => {
    expect(getRowTitle("chosen")).toBe("Optimal discard");
  });
});
