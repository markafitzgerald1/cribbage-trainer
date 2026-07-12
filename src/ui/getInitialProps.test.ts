/* jscpd:ignore-start */
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { SortOrder } from "./SortOrder";
import { getInitialProps } from "./getInitialProps";
/* jscpd:ignore-end */

describe("getInitialProps", () => {
  it("returns null initialCards when no hand param is present", () => {
    const props = getInitialProps("?seed=123");

    expect(props.initialCards).toBeNull();
    expect(props.seed).toBe("123");
  });

  it("returns parsed initialCards when hand param is present", () => {
    const props = getInitialProps("?hand=AH,2H,3H,4H,5H,6H");

    expect(props.initialCards?.[0]?.rankLabel).toBe("A");
  });

  it("returns null initialCards when hand param is malformed", () => {
    const props = getInitialProps("?hand=AH,ZZ");

    expect(props.initialCards).toBeNull();
  });

  it("returns null initialCards when hand param has duplicate cards", () => {
    const props = getInitialProps("?hand=AH,AH,2H,3H,4H,5H");

    expect(props.initialCards).toBeNull();
  });

  it.each([
    ["too few", "AH,2H,3H,4H,5H"],
    ["too many", "AH,2H,3H,4H,5H,6H,7H"],
  ])("returns null initialCards when hand param has %s cards", (_, hand) => {
    const props = getInitialProps(`?hand=${hand}`);

    expect(props.initialCards).toBeNull();
  });

  it("returns null seed when no seed param is present", () => {
    const props = getInitialProps("");

    expect(props.seed).toBeNull();
  });

  it("returns parsed role, discards, and sort orders when present", () => {
    const props = getInitialProps(
      "?hand=AH,2H,3H,4H,5H,6H&role=dealer&discard=AH&sort=deal-order&analysis-sort=crib",
    );

    expect(props.initialCribRole).toBe(CribRole.Dealer);
    expect(props.initialDiscards?.[0]?.rankLabel).toBe("A");
    expect(props.initialScoreSortKey).toBe(
      ScoredKeepDiscardSortKey.ExpectedCribPoints,
    );
    expect(props.initialSortOrder).toBe(SortOrder.DealOrder);
  });

  it("returns null role, discards, and sort orders when absent", () => {
    const props = getInitialProps("?hand=AH,2H,3H,4H,5H,6H");

    expect(props.initialCribRole).toBeNull();
    expect(props.initialDiscards).toBeNull();
    expect(props.initialScoreSortKey).toBeNull();
    expect(props.initialSortOrder).toBeNull();
  });
});
