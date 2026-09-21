/* jscpd:ignore-start */
import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CribUncertainty } from "../game/cribUncertainty";
import { type ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import cribTableData from "../game/expectedCribPointsTable.json";
import { parseHand } from "../game/Card";
import playTableData from "../game/expectedPlayPointsTable.json";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

const HAND = "AC,2D,5H,7S,9C,KD";
const CHOSEN_DISCARD = "AC,2D";
const CRIB_TABLE = cribTableData as unknown as ExpectedCribPointsTable;
const PLAY_TABLE = playTableData as unknown as ExpectedPlayPointsTable;

const everyRecord = (standardError: number): CribUncertainty => ({
  totals: { get: () => standardError },
});

const renderAnalysis = (
  loadCribUncertainty: () => Promise<CribUncertainty | null>,
  loadCribTable: () => Promise<ExpectedCribPointsTable> = () =>
    Promise.resolve(CRIB_TABLE),
) =>
  render(
    <ScoredPossibleKeepDiscards
      cribRole={CribRole.Dealer}
      dealtCards={toDealtCards(parseHand(HAND), parseHand(CHOSEN_DISCARD))}
      loadCribTable={loadCribTable}
      loadCribUncertainty={loadCribUncertainty}
      loadPlayTable={() => Promise.resolve(PLAY_TABLE)}
      onAnalysisRendered={jest.fn()}
      onScoreSortKeyChange={jest.fn()}
      scoreSortKey={ScoredKeepDiscardSortKey.ExpectedNetPoints}
      sortOrder={SortOrder.Ascending}
    />,
  );

const expandFirstDiscard = async () => {
  const toggles = await screen.findAllByRole("button", {
    name: /^Expand analysis for discard/u,
  });

  fireEvent.click(toggles[0] as HTMLElement);
};

describe("crib uncertainty in the analysis table", () => {
  it.each([
    {
      displayed: "0.25",
      name: "a bound of a quarter point",
      standardError: 0.25,
    },
    { displayed: "0.00", name: "a measured zero", standardError: 0 },
  ])(
    "shows $name under the crib average once the sidecar arrives",
    async ({ displayed, standardError }) => {
      renderAnalysis(() => Promise.resolve(everyRecord(standardError)));
      await expandFirstDiscard();

      await waitFor(() => {
        expect(
          screen.getAllByText(`\u00b1${displayed}`).length,
        ).toBeGreaterThan(0);
      });

      expect(
        screen.getAllByText(`plus or minus ${displayed} simulation error`)
          .length,
      ).toBeGreaterThan(0);
    },
  );

  it.each([
    { load: () => Promise.resolve(null), name: "the sidecar is unavailable" },
    {
      load: () => Promise.reject(new Error("offline")),
      name: "the sidecar loader rejects",
    },
  ])("ranks the discards with no bound when $name", async ({ load }) => {
    renderAnalysis(load);
    await expandFirstDiscard();

    // The crib average itself is on screen, so the absent bound is a decision rather than a component that failed to render.
    await expect(
      screen.findByRole("button", { name: /Crib avg/u }),
    ).resolves.toBeTruthy();
    expect(screen.queryByText(/±/u)).toBeNull();
  });

  it("defers the sidecar until the ranked results are on screen", async () => {
    const tableHandles: {
      resolve?: (table: ExpectedCribPointsTable) => void;
    } = {};
    const pendingCribTable = new Promise<ExpectedCribPointsTable>((resolve) => {
      tableHandles.resolve = resolve;
    });
    const loadCribUncertainty = jest.fn(() =>
      Promise.resolve(everyRecord(0.25)),
    );

    renderAnalysis(loadCribUncertainty, () => pendingCribTable);

    expect(screen.getByText("Loading analysis...")).toBeTruthy();
    expect(loadCribUncertainty).not.toHaveBeenCalled();

    tableHandles.resolve?.(CRIB_TABLE);

    await waitFor(() => {
      expect(loadCribUncertainty).toHaveBeenCalledTimes(1);
    });

    expect(loadCribUncertainty).toHaveBeenCalledTimes(1);
  });
});
