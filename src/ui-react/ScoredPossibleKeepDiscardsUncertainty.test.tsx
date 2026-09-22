/* jscpd:ignore-start */
import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import {
  deferredUncertainty,
  rejectingUncertainty,
  uniformUncertainty,
} from "../game/uncertaintySidecar.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import type { UncertaintySource } from "../game/uncertaintyLoader";
import cribTableData from "../game/expectedCribPointsTable.json";
import { parseHand } from "../game/Card";
import playTableData from "../game/expectedPlayPointsTable.json";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

const HAND = "AC,2D,5H,7S,9C,KD";
const CHOSEN_DISCARD = "AC,2D";
const CRIB_TABLE = cribTableData as unknown as ExpectedCribPointsTable;
const PLAY_TABLE = playTableData as unknown as ExpectedPlayPointsTable;

/*
 * Held rather than rebuilt per render: the component takes each source as an
 * effect dependency, so a fresh object would restart the load every render.
 * It also stands in for the sidecar not under test, which is what keeps a
 * "no figure anywhere" assertion from tripping over the other one.
 */
const NO_UNCERTAINTY = deferredUncertainty(null);

type PendingCribTable = () => Promise<ExpectedCribPointsTable>;

const RESOLVED_CRIB_TABLE: PendingCribTable = () => Promise.resolve(CRIB_TABLE);

const renderAnalysis = (
  cribUncertaintySource: UncertaintySource,
  playUncertaintySource: UncertaintySource,
  loadCribTable: PendingCribTable = RESOLVED_CRIB_TABLE,
) =>
  render(
    <ScoredPossibleKeepDiscards
      cribRole={CribRole.Dealer}
      cribUncertaintySource={cribUncertaintySource}
      dealtCards={toDealtCards(parseHand(HAND), parseHand(CHOSEN_DISCARD))}
      loadCribTable={loadCribTable}
      loadPlayTable={() => Promise.resolve(PLAY_TABLE)}
      onAnalysisRendered={jest.fn()}
      onScoreSortKeyChange={jest.fn()}
      playUncertaintySource={playUncertaintySource}
      scoreSortKey={ScoredKeepDiscardSortKey.ExpectedNetPoints}
      sortOrder={SortOrder.Ascending}
    />,
  );

interface SidecarCase {
  readonly name: string;
  readonly renderWith: (
    source: UncertaintySource,
    loadCribTable?: PendingCribTable,
  ) => ReturnType<typeof render>;
  readonly totalRowName: RegExp;
}

/*
 * Both sidecars answer the same three questions - the figure appears when the
 * document arrives, the ranking is unchanged when it does not, and neither is
 * fetched before the means are on screen - so they are asserted together
 * rather than in two specs jscpd would call one. What differs between them is
 * which row carries the figure, and that is the case data.
 */
const SIDECARS: readonly SidecarCase[] = [
  {
    name: "crib",
    renderWith: (source, loadCribTable) =>
      renderAnalysis(source, NO_UNCERTAINTY, loadCribTable),
    totalRowName: /Crib avg/u,
  },
  {
    name: "play",
    renderWith: (source, loadCribTable) =>
      renderAnalysis(NO_UNCERTAINTY, source, loadCribTable),
    totalRowName: /You - Opp/u,
  },
];

const expandFirstDiscard = async () => {
  const toggles = await screen.findAllByRole("button", {
    name: /^Expand analysis for discard/u,
  });

  fireEvent.click(toggles[0] as HTMLElement);
};

describe.each(SIDECARS)(
  "$name uncertainty in the analysis table",
  ({ renderWith, totalRowName }) => {
    it.each([
      {
        displayed: "0.25",
        name: "a figure of a quarter point",
        standardError: 0.25,
      },
      { displayed: "0.00", name: "a measured zero", standardError: 0 },
    ])(
      "shows $name under the total once the sidecar arrives",
      async ({ displayed, standardError }) => {
        renderWith(deferredUncertainty(uniformUncertainty(standardError)));
        await expandFirstDiscard();

        await waitFor(() => {
          expect(screen.getAllByText(`±${displayed}`).length).toBeGreaterThan(
            0,
          );
        });

        expect(
          screen.getAllByText(`plus or minus ${displayed} simulation error`)
            .length,
        ).toBeGreaterThan(0);
      },
    );

    it.each([
      { name: "the sidecar is unavailable", source: deferredUncertainty(null) },
      { name: "the sidecar loader rejects", source: rejectingUncertainty() },
    ])("ranks the discards with no figure when $name", async ({ source }) => {
      renderWith(source);
      await expandFirstDiscard();

      // The total itself is on screen, so the absent figure is a decision rather than a component that failed to render.
      await expect(
        screen.findByRole("button", { name: totalRowName }),
      ).resolves.toBeTruthy();
      expect(screen.queryByText(/±/u)).toBeNull();
    });

    it("defers the sidecar until the ranked results are on screen", async () => {
      const tableHandles: {
        resolve?: (table: ExpectedCribPointsTable) => void;
      } = {};
      const pendingCribTable = new Promise<ExpectedCribPointsTable>(
        (resolve) => {
          tableHandles.resolve = resolve;
        },
      );
      const loadUncertainty = jest.fn(() =>
        Promise.resolve(uniformUncertainty(0.25)),
      );
      const source = { getUncertaintySync: () => null, loadUncertainty };

      renderWith(source, () => pendingCribTable);

      expect(screen.getByText("Loading analysis...")).toBeTruthy();
      expect(loadUncertainty).not.toHaveBeenCalled();

      tableHandles.resolve?.(CRIB_TABLE);

      await waitFor(() => {
        expect(loadUncertainty).toHaveBeenCalledTimes(1);
      });

      expect(loadUncertainty).toHaveBeenCalledTimes(1);
    });
  },
);
