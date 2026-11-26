import {
  FIXTURE_HAND_KEY,
  FIXTURE_LINES,
  lead,
} from "./openingPlays.test.common";
import {
  type OpeningPlayItem,
  formatShare,
  openingPlayItems,
} from "./openingPlaysText";
import { describe, expect, it } from "@jest/globals";
import type { PegLines } from "../game/pegLines";

const itemsOf = (lines: PegLines, isPone: boolean) =>
  openingPlayItems(lines, isPone, FIXTURE_HAND_KEY) as OpeningPlayItem[];

const sentences = (lines: PegLines, isPone: boolean) =>
  itemsOf(lines, isPone).map(({ sentence }) => sentence);

const dealerReplying = (responseCount: number): PegLines => ({
  ...FIXTURE_LINES,
  dealerRows: () => [{ ...lead(3, 1000), response: 6, responseCount }],
});

describe("formatShare", () => {
  it.each([
    { expected: "<1%", share: 0.004 },
    { expected: "1%", share: 0.005 },
    { expected: "58%", share: 0.5757 },
    { expected: "99%", share: 0.994 },
    { expected: ">99%", share: 0.996 },
    { expected: "100%", share: 1 },
  ])("shows $share as $expected", ({ expected, share }) => {
    expect.hasAssertions();

    expect(formatShare(share)).toBe(expected);
  });
});

describe("openingPlayItems", () => {
  it("reads each pone lead as a sentence, most played first", () => {
    expect.hasAssertions();

    expect(sentences(FIXTURE_LINES, true)).toStrictEqual([
      "You lead 3 in 58% of hands",
      "You lead 2 in 42% of hands",
    ]);
  });

  it("names a ten in full and spells out a rare other share", () => {
    expect.hasAssertions();

    const lines = {
      ...FIXTURE_LINES,
      poneRows: () => [lead(9, 9960), lead(0, 40)],
    };

    expect(sentences(lines, true)).toStrictEqual([
      "You lead 10 in more than 99% of hands",
      "You lead another rank in less than 1% of hands",
    ]);
    expect(itemsOf(lines, true).map(({ cells }) => cells)).toStrictEqual([
      [["lead", "10 >99%"]],
      [["lead", "other <1%"]],
    ]);
  });

  it.each([
    { expected: "always", responseCount: 995 },
    { expected: "99%", responseCount: 994 },
  ])(
    "shows a reply played $responseCount times in 1000 as $expected",
    ({ expected, responseCount }) => {
      expect.hasAssertions();

      const [item] = itemsOf(dealerReplying(responseCount), false);

      expect(item?.cells.at(-1)).toStrictEqual(["replyShare", expected]);
    },
  );

  it("reads dealer rows as sentences and folds rare leads into other", () => {
    expect.hasAssertions();

    const dealer = sentences(FIXTURE_LINES, false);

    expect(dealer).toContain(
      "They lead 4 in 19% of hands, and you reply 7 every time",
    );
    expect(dealer).toContain(
      "They lead J in 10% of hands, and you reply 3 in 95% of those",
    );
    expect(dealer.at(-1)).toBe("They lead another rank in 8% of hands");
    expect(dealer).toHaveLength(11);
  });

  it.each([true, false])(
    "is null for a hand the file lacks (pone: %s)",
    (isPone) => {
      expect.hasAssertions();

      expect(openingPlayItems(FIXTURE_LINES, isPone, "A_A_A_A")).toBeNull();
    },
  );
});
