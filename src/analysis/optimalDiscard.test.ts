import {
  computeOptimalDiscardMargin,
  isEqualBestCandidate,
} from "./optimalDiscard";
import { describe, expect, it } from "@jest/globals";

const ALL_TIED_MARGIN = {
  accessibleLabel: "Optimal discard, all tied",
  label: "Optimal discard, all tied",
  margin: null,
};

describe("optimalDiscard", () => {
  describe("computeOptimalDiscardMargin", () => {
    it.each([
      {
        candidates: [
          { expectedNetPoints: 12.39 },
          { expectedNetPoints: 9.85 },
          { expectedNetPoints: 8.5 },
        ],
        expected: {
          accessibleLabel: "Optimal discard, 2.54 better than next",
          label: "Optimal discard, 2.54 better than next",
          margin: 2.54,
        },
        name: "clear margin when runner-up has a distinct lower score",
      },
      {
        candidates: [
          { expectedNetPoints: 10.0 },
          { expectedNetPoints: 10.0 },
          { expectedNetPoints: 8.0 },
        ],
        expected: {
          accessibleLabel: "Optimal discard, 2.00 better than next",
          label: "Optimal discard, 2.00 better than next",
          margin: 2.0,
        },
        name: "margin against next distinct net score when top options tie (two-way tie)",
      },
      {
        candidates: [
          { expectedNetPoints: -0.11 },
          { expectedNetPoints: -0.11 },
          { expectedNetPoints: -0.11 },
          { expectedNetPoints: -1.25 },
        ],
        expected: {
          accessibleLabel: "Optimal discard, 1.14 better than next",
          label: "Optimal discard, 1.14 better than next",
          margin: 1.14,
        },
        name: "margin against next distinct score on multi-way top tie",
      },
      {
        candidates: [
          { expectedNetPoints: 4.5 },
          { expectedNetPoints: 4.5 },
          { expectedNetPoints: 4.5 },
        ],
        expected: ALL_TIED_MARGIN,
        name: "all tied when every candidate shares the top net score",
      },
      {
        candidates: [{ expectedNetPoints: 7.2 }],
        expected: ALL_TIED_MARGIN,
        name: "all tied for a single candidate list",
      },
      {
        candidates: [],
        expected: {
          accessibleLabel: "Optimal discard",
          label: "Optimal discard",
          margin: null,
        },
        name: "empty candidate list gracefully",
      },
      {
        candidates: [{ expectedNetPoints: 10.0 }, { expectedNetPoints: 9.996 }],
        expected: {
          accessibleLabel: "Optimal discard, less than 0.01 better than next",
          label: "Optimal discard, < 0.01 better than next",
          margin: 0.004,
        },
        name: "margin below display precision with less-than indicator",
      },
      {
        candidates: [
          { expectedNetPoints: 10.0 },
          { expectedNetPoints: 9.99995 },
        ],
        expected: ALL_TIED_MARGIN,
        name: "sub-threshold gap of 0.00005 treated as tied top score",
      },
      {
        candidates: [
          { expectedNetPoints: 10.0 },
          { expectedNetPoints: 9.9999 },
        ],
        expected: {
          accessibleLabel: "Optimal discard, less than 0.01 better than next",
          label: "Optimal discard, < 0.01 better than next",
          margin: 0.0001,
        },
        name: "gap matching distinct threshold 0.0001 treated as distinct runner-up",
      },
    ])("reports $name", ({ candidates, expected }) => {
      expect(computeOptimalDiscardMargin(candidates)).toStrictEqual(expected);
    });
  });

  describe("isEqualBestCandidate", () => {
    it.each([
      {
        bestNet: 10.5,
        candidateNet: 10.5,
        expected: true,
        name: "identical scores",
      },
      {
        bestNet: 10.5,
        candidateNet: 10.5000001,
        expected: true,
        name: "difference within floating-point residue",
      },
      {
        bestNet: 10.5,
        candidateNet: 10.49995,
        expected: true,
        name: "difference below 0.0001 distinct threshold treated as equal-best",
      },
      {
        bestNet: 10.5,
        candidateNet: 10.4999,
        expected: false,
        name: "difference at 0.0001 distinct threshold treated as unequal",
      },
      {
        bestNet: 10.5,
        candidateNet: 10.49,
        expected: false,
        name: "materially worse candidate",
      },
    ])("evaluates $name", ({ bestNet, candidateNet, expected }) => {
      expect(isEqualBestCandidate(bestNet, candidateNet)).toBe(expected);
    });
  });
});
