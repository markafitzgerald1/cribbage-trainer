import {
  type UrlAnalysisState,
  parseUrlAnalysisState,
  serializeUrlAnalysisState,
} from "./urlAnalysisState";
import { describe, expect, it } from "@jest/globals";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import { CribRole } from "../game/expectedCribPoints";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { SortOrder } from "./SortOrder";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";

const VALID_HAND = "KH,QS,10D,9C,6S,5H";

const discardRankLabels = (state: UrlAnalysisState) =>
  state.discards?.map((card) => card.rankLabel);

const expectHydratedPoneState = (
  state: UrlAnalysisState,
  expectedDiscardRankLabels: readonly string[],
  expectedSortOrder: SortOrder,
) => {
  expect(state.cards).toHaveLength(CARDS_PER_DEALT_HAND);
  expect(state.cribRole).toBe(CribRole.Pone);
  expect(discardRankLabels(state)).toStrictEqual(expectedDiscardRankLabels);
  expect(state.sortOrder).toBe(expectedSortOrder);
};

describe("parseUrlAnalysisState", () => {
  it("parses a full valid state", () => {
    const state = parseUrlAnalysisState(
      `?hand=${VALID_HAND}&role=pone&discard=6S,5H&sort=ascending&analysis-sort=play`,
    );

    expectHydratedPoneState(state, ["6", "5"], SortOrder.Ascending);

    expect(state.scoreSortKey).toBe(
      ScoredKeepDiscardSortKey.ExpectedPlayPoints,
    );
  });

  it("returns all nulls for an empty search string", () => {
    expect(parseUrlAnalysisState("")).toStrictEqual({
      cards: null,
      cribRole: null,
      discards: null,
      scoreSortKey: null,
      sortOrder: null,
    });
  });

  it.each([
    ["too few cards", "KH,QS,10D,9C,6S"],
    ["too many cards", "KH,QS,10D,9C,6S,5H,4D"],
    ["an invalid rank", "XH,QS,10D,9C,6S,5H"],
    ["an invalid suit", "KX,QS,10D,9C,6S,5H"],
    ["duplicate cards", "KH,KH,10D,9C,6S,5H"],
  ])("returns null cards for a hand with %s", (_description, hand) => {
    expect(parseUrlAnalysisState(`?hand=${hand}`).cards).toBeNull();
  });

  it.each([
    ["dealer", CribRole.Dealer],
    ["PONE", CribRole.Pone],
  ])("parses role %p case-insensitively", (role, expectedCribRole) => {
    expect(parseUrlAnalysisState(`?role=${role}`).cribRole).toBe(
      expectedCribRole,
    );
  });

  it("returns a null role for an unknown role value", () => {
    expect(parseUrlAnalysisState("?role=kibitzer").cribRole).toBeNull();
  });

  it("parses a single-card discard", () => {
    const state = parseUrlAnalysisState(`?hand=${VALID_HAND}&discard=6S`);

    expect(discardRankLabels(state)).toStrictEqual(["6"]);
  });

  it.each([
    ["no hand accompanies it", "?discard=6S,5H"],
    ["a card is not in the hand", `?hand=${VALID_HAND}&discard=6S,5C`],
    ["it has more than two cards", `?hand=${VALID_HAND}&discard=KH,QS,10D`],
    ["it repeats a card", `?hand=${VALID_HAND}&discard=6S,6S`],
    ["it has an invalid card", `?hand=${VALID_HAND}&discard=ZZ`],
  ])("returns null discards when %s", (_description, search) => {
    expect(parseUrlAnalysisState(search).discards).toBeNull();
  });

  it.each([
    ["deal-order", SortOrder.DealOrder],
    ["descending", SortOrder.Descending],
    ["ASCENDING", SortOrder.Ascending],
  ])("parses sort %p case-insensitively", (sort, expectedSortOrder) => {
    expect(parseUrlAnalysisState(`?sort=${sort}`).sortOrder).toBe(
      expectedSortOrder,
    );
  });

  it("returns a null sort order for an unknown sort value", () => {
    expect(parseUrlAnalysisState("?sort=random").sortOrder).toBeNull();
  });

  it.each([
    ["hand", ScoredKeepDiscardSortKey.ExpectedHandPoints],
    ["crib", ScoredKeepDiscardSortKey.ExpectedCribPoints],
    ["play", ScoredKeepDiscardSortKey.ExpectedPlayPoints],
    ["NET", ScoredKeepDiscardSortKey.ExpectedNetPoints],
  ])(
    "parses analysis sort %p case-insensitively",
    (analysisSort, expectedScoreSortKey) => {
      expect(
        parseUrlAnalysisState(`?analysis-sort=${analysisSort}`).scoreSortKey,
      ).toBe(expectedScoreSortKey);
    },
  );

  it("returns a null score sort key for an unknown analysis sort value", () => {
    expect(
      parseUrlAnalysisState("?analysis-sort=starter").scoreSortKey,
    ).toBeNull();
  });
});

const dealerStateDiscardingSixFive = (sortOrder: SortOrder) => ({
  cribRole: CribRole.Dealer,
  dealtCards: toDealtCards(parseHand(VALID_HAND), parseHand("6S,5H")),
  scoreSortKey: ScoredKeepDiscardSortKey.ExpectedNetPoints,
  sortOrder,
});

describe("serializeUrlAnalysisState", () => {
  it("serializes hand, role, discards, and sorts while preserving other params", () => {
    const url = serializeUrlAnalysisState(
      "?seed=123",
      dealerStateDiscardingSixFive(SortOrder.DealOrder),
    );

    expect(url).toBe(
      `?seed=123&hand=${VALID_HAND}&role=dealer&discard=6S,5H&sort=deal-order&analysis-sort=net`,
    );
  });

  it.each([
    [ScoredKeepDiscardSortKey.ExpectedHandPoints, "hand"],
    [ScoredKeepDiscardSortKey.ExpectedCribPoints, "crib"],
    [ScoredKeepDiscardSortKey.ExpectedPlayPoints, "play"],
    [ScoredKeepDiscardSortKey.ExpectedNetPoints, "net"],
  ])(
    "serializes score sort key %p as analysis sort %p",
    (scoreSortKey, expectedAnalysisSort) => {
      const url = serializeUrlAnalysisState("", {
        ...dealerStateDiscardingSixFive(SortOrder.Descending),
        scoreSortKey,
      });

      expect(url).toContain(`analysis-sort=${expectedAnalysisSort}`);
    },
  );

  it("keeps encoded commas in unrelated params while decoding card lists", () => {
    const url = serializeUrlAnalysisState(
      "?note=a%2Cb",
      dealerStateDiscardingSixFive(SortOrder.Descending),
    );

    expect(url).toContain("note=a%2Cb");
    expect(url).toContain(`hand=${VALID_HAND}`);
    expect(url).toContain("discard=6S,5H");
  });

  it("removes a stale discard param when no cards are discarded", () => {
    const url = serializeUrlAnalysisState("?discard=6S", {
      cribRole: CribRole.Pone,
      dealtCards: toDealtCards(parseHand(VALID_HAND), null),
      scoreSortKey: ScoredKeepDiscardSortKey.ExpectedNetPoints,
      sortOrder: SortOrder.Descending,
    });

    expect(url).toBe(
      `?hand=${VALID_HAND}&role=pone&sort=descending&analysis-sort=net`,
    );
  });

  it("writes cards in deal order regardless of array order", () => {
    const url = serializeUrlAnalysisState("", {
      cribRole: CribRole.Dealer,
      dealtCards: toDealtCards(parseHand(VALID_HAND), null).reverse(),
      scoreSortKey: ScoredKeepDiscardSortKey.ExpectedNetPoints,
      sortOrder: SortOrder.Ascending,
    });

    expect(url).toBe(
      `?hand=${VALID_HAND}&role=dealer&sort=ascending&analysis-sort=net`,
    );
  });

  it("round-trips through parseUrlAnalysisState", () => {
    const url = serializeUrlAnalysisState("", {
      cribRole: CribRole.Pone,
      dealtCards: toDealtCards(parseHand(VALID_HAND), parseHand("KH")),
      scoreSortKey: ScoredKeepDiscardSortKey.ExpectedCribPoints,
      sortOrder: SortOrder.Ascending,
    });
    const state = parseUrlAnalysisState(url);

    expectHydratedPoneState(state, ["K"], SortOrder.Ascending);

    expect(state.scoreSortKey).toBe(
      ScoredKeepDiscardSortKey.ExpectedCribPoints,
    );
  });
});
