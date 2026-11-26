import { describe, expect, it } from "@jest/globals";
import { foldOpenings, replyShare } from "./openingPlays";

const row = (lead: number, count: number) => ({
  count,
  lead,
  mean: null,
  standardError: null,
});

const SIMULATIONS = 13_000;
const JUST_UNDER_FIVE_PERCENT = 649;
const FIVE_PERCENT = 650;

const shownRanks = (rows: ReturnType<typeof row>[]) =>
  foldOpenings(rows).shown.map((opening) => opening.row.lead);

describe("foldOpenings", () => {
  it("orders shown plays by how often they were chosen", () => {
    expect.hasAssertions();

    const [first, second] = [row(2, 7485), row(1, 5515)];

    expect(foldOpenings([second, first])).toStrictEqual({
      otherShare: 0,
      shown: [
        { row: first, share: 7485 / SIMULATIONS },
        { row: second, share: 5515 / SIMULATIONS },
      ],
    });
  });

  it("breaks a tie in count by rank order", () => {
    expect.hasAssertions();

    expect(shownRanks([row(4, 500), row(2, 500)])).toStrictEqual([2, 4]);
  });

  it("folds a play below five percent into other and keeps one at five", () => {
    expect.hasAssertions();

    const rows = [
      row(0, JUST_UNDER_FIVE_PERCENT),
      row(1, FIVE_PERCENT),
      row(2, SIMULATIONS - JUST_UNDER_FIVE_PERCENT - FIVE_PERCENT),
    ];

    expect(shownRanks(rows)).toStrictEqual([2, 1]);
    expect(foldOpenings(rows).otherShare).toBe(
      JUST_UNDER_FIVE_PERCENT / SIMULATIONS,
    );
  });

  it("folds a play seen fewer than 200 times however large its share", () => {
    expect.hasAssertions();

    const rows = [row(0, 199), row(1, 200)];

    expect(shownRanks(rows)).toStrictEqual([1]);
    expect(foldOpenings(rows).otherShare).toBe(199 / 399);
  });
});

describe("replyShare", () => {
  it("is the modal reply's share of its own lead", () => {
    expect.hasAssertions();

    expect(
      replyShare({ ...row(10, 1313), response: 2, responseCount: 1249 }),
    ).toBe(1249 / 1313);
  });
});
