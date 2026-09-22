/* jscpd:ignore-start */
import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import {
  deferredUncertainty,
  trackedUnavailableUncertainty,
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
 * "no figure anywhere" assertion from tripping over the other one - and it is
 * tracked, so that assertion can wait out its load rather than beating it.
 */
const STAND_IN = trackedUnavailableUncertainty("resolve");
const NO_UNCERTAINTY = STAND_IN.source;

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
  /*
   * The spoken text is per sidecar on purpose: the crib figure is a bound
   * over combined buckets and the play figure is one record's own standard
   * error omitting a policy term, so a shared phrase would announce them as
   * the same quantity. Pinning each here is what keeps them distinct.
   */
  readonly spokenSuffix: string;
  /*
   * Visual-only, on the `aria-hidden` half: a sighted reader gets the
   * qualification on hover where the Total column has no room to print it.
   */
  readonly tooltip: string;
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
    spokenSuffix: ", a bound on the combined simulation error",
    tooltip:
      "Bound on the combined simulation error of the buckets this average used",
    totalRowName: /Crib avg/u,
  },
  {
    name: "play",
    renderWith: (source, loadCribTable) =>
      renderAnalysis(NO_UNCERTAINTY, source, loadCribTable),
    spokenSuffix:
      " simulation standard error, which excludes policy uncertainty",
    tooltip:
      "Simulation standard error of this figure; excludes policy uncertainty",
    totalRowName: /You - Opp/u,
  },
];

const expandFirstDiscard = async () => {
  const toggles = await screen.findAllByRole("button", {
    name: /^Expand analysis for discard/u,
  });

  fireEvent.click(toggles[0] as HTMLElement);
};

/*
 * Render an available sidecar, open a row, and wait for its figure. Shared by
 * the two cases that need a figure on screen before they assert anything
 * about it; jscpd counts the second spelling of this preamble as a clone.
 */
const expandWithFigure = async (
  renderWith: SidecarCase["renderWith"],
  standardError: number,
  displayed: string,
) => {
  renderWith(deferredUncertainty(uniformUncertainty(standardError)));
  await expandFirstDiscard();

  await waitFor(() => {
    expect(screen.getAllByText(`\u00b1${displayed}`).length).toBeGreaterThan(0);
  });
};

describe.each(SIDECARS)(
  "$name uncertainty in the analysis table",
  ({ renderWith, spokenSuffix, tooltip, totalRowName }) => {
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
        await expandWithFigure(renderWith, standardError, displayed);

        expect(
          screen.getAllByText(`plus or minus ${displayed}${spokenSuffix}`)
            .length,
        ).toBeGreaterThan(0);
      },
    );

    it.each([
      { name: "the sidecar is unavailable", outcome: "resolve" },
      { name: "the sidecar loader rejects", outcome: "reject" },
    ] as const)(
      "ranks the discards with no figure when $name",
      async ({ outcome }) => {
        const unavailable = trackedUnavailableUncertainty(outcome);

        renderWith(unavailable.source);
        await expandFirstDiscard();

        // The total itself is on screen, so the absent figure is a decision rather than a component that failed to render.
        await expect(
          screen.findByRole("button", { name: totalRowName }),
        ).resolves.toBeTruthy();

        /*
         * Both loads have to have finished before absence means anything: a
         * build that rendered the figure only once the promise settled would
         * satisfy this assertion on the race instead. The load count is
         * asserted for the same reason - a source that was never asked is
         * absent for a reason this test is not about.
         */
        await Promise.all([unavailable.settled(), STAND_IN.settled()]);

        expect(unavailable.loadCount()).toBeGreaterThan(0);
        expect(screen.queryByText(/±/u)).toBeNull();
      },
    );

    // Visual only, on the aria-hidden half, so a sighted reader can learn which figure this is.
    it("names which kind of figure it is", async () => {
      await expandWithFigure(renderWith, 0.25, "0.25");

      expect(screen.getByTitle(tooltip)).toBeTruthy();
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
