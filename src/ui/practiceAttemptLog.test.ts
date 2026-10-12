import { describe, expect, it } from "@jest/globals";
import { isAttemptDetail, normalizeAttemptLog } from "./practiceAttemptLog";

const handKey = "AH,2H,3H,4H,5H,6H|Dealer";
const detail = {
  basis: "exact-v1",
  discardKey: "AH,2H",
  expectedPointsLoss: 0,
  isOptimal: true,
  outcome: "success",
  tableIdentity: null,
};
const entry = { ...detail, at: 100, handKey, order: 1 };

describe("practice attempt payload validation", () => {
  it.each([
    null,
    { ...detail, discardKey: "bad" },
    { ...detail, discardKey: "AH" },
    { ...detail, discardKey: "AH,AH" },
    { ...detail, discardKey: "AH,2S" },
    { ...detail, expectedPointsLoss: -1 },
    { ...detail, expectedPointsLoss: Infinity },
    { ...detail, expectedPointsLoss: 1 },
    { ...detail, isOptimal: "true" },
    { ...detail, outcome: "pending" },
    { ...detail, basis: "future-rule" },
    { ...detail, outcome: "failure" },
    {
      ...detail,
      basis: "exact-fallback-v1",
      expectedPointsLoss: 1,
      isOptimal: false,
    },
  ])("rejects malformed or inconsistent detail %j", (value) => {
    expect(isAttemptDetail(value, handKey)).toBe(false);
  });

  it("rejects a hand nobody can replay", () => {
    expect(isAttemptDetail(detail, "bad")).toBe(false);
  });

  it.each(["exact-v1", "exact-fallback-v1", "sampling-noise-v1"])(
    "accepts a real best choice with basis %s",
    (basis) => {
      expect(isAttemptDetail({ ...detail, basis }, handKey)).toBe(true);
    },
  );

  it.each(["success", "failure"])(
    "keeps a positive noise-judged %s separate from the exact best-choice flag",
    (outcome) => {
      expect(
        isAttemptDetail(
          {
            ...detail,
            basis: "sampling-noise-v1",
            expectedPointsLoss: 0.01,
            isOptimal: false,
            outcome,
          },
          handKey,
        ),
      ).toBe(true);
    },
  );

  it.each([
    null,
    { ...entry, handKey: null },
    { ...entry, at: NaN },
    { ...entry, order: -1 },
    { ...entry, order: 0 },
    { ...entry, order: 1.5 },
    { ...entry, discardKey: "bad" },
  ])("drops malformed stored entry %j", (value) => {
    expect(normalizeAttemptLog([value], [])).toStrictEqual([]);
  });

  it("drops duplicate or reversed stored orders instead of inventing a new observed order", () => {
    expect(
      normalizeAttemptLog(
        [{ ...entry, order: 2 }, entry, { ...entry, order: 3 }],
        [],
      ).map((row) => row.order),
    ).toStrictEqual([2, 3]);
  });

  it("retains the latest 1,000 stored retries when older logs exceed the cap", () => {
    const log = Array.from({ length: 1_001 }, (_, index) => ({
      ...entry,
      order: index + 1,
    }));
    const retained = normalizeAttemptLog(log, []);

    expect(retained).toHaveLength(1_000);
    expect(retained[0]?.order).toBe(2);
    expect(retained.at(-1)?.order).toBe(1_001);
  });

  it("reads compact attempt transport without assigning unknown provenance", () => {
    const stored = [
      handKey,
      detail.discardKey,
      100,
      1,
      null,
      0,
      true,
      "success",
      "exact-v1",
    ];

    expect(normalizeAttemptLog([stored], [])).toStrictEqual([entry]);
    expect(normalizeAttemptLog([stored.slice(0, 3)], [])).toStrictEqual([]);
  });
});
