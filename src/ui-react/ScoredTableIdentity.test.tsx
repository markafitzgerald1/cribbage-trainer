/* jscpd:ignore-start */
import {
  HAND,
  OTHER_HAND,
  handOf,
  noteOrigin,
  renderTallyWithMutableCards,
} from "./useDiscardTally.test.common";
import {
  ScoredPossibleKeepDiscards,
  type ScoredPossibleKeepDiscardsProps,
} from "./ScoredPossibleKeepDiscards";
import { describe, expect, it, jest } from "@jest/globals";
import {
  expectedCribPointsTable,
  expectedPlayPointsTable,
} from "../analysis/analysis.test.common";
import {
  noUncertainty,
  waitForAnalysis,
} from "./ScoredPossibleKeepDiscards.test.common";
import { render, waitFor } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { SortOrder } from "../ui/SortOrder";
import type { TableIdentity } from "../game/tableIdentity";
import { parseHand } from "../game/Card";
import { readTallyForDisplay } from "../ui/discardTally";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

/* jscpd:ignore-start */
const identity = {
  crib: { means_sha256: "a".repeat(64) },
  play: { means_sha256: "b".repeat(64) },
};
/* jscpd:ignore-end */

describe("scored analysis provenance", () => {
  /* jscpd:ignore-start */
  it("keeps the original record after scoring with new means makes its discard best, then stamps a new hand with the new pair", async () => {
    const bucket = expectedPlayPointsTable["3_4_5_6"];
    const dealer = bucket.Dealer;
    const own = dealer.players.Dealer;
    // Controlled test means change the selected keep; all component and seat totals remain consistent.
    const playB = {
      ...expectedPlayPointsTable,
      "3_4_5_6": {
        ...bucket,
        Dealer: {
          ...dealer,
          mu: dealer.mu + 20,
          players: {
            ...dealer.players,
            Dealer: {
              ...own,
              mu: own.mu + 20,
              points: { ...own.points, go: { mu: own.points.go.mu + 20 } },
            },
          },
        },
      },
    };
    const identityB = { ...identity, play: { means_sha256: "c".repeat(64) } };
    const hook = renderTallyWithMutableCards(handOf(HAND));
    const report = jest.fn<
      ScoredPossibleKeepDiscardsProps["onAnalysisRendered"]
    >((analysis, tableIdentity) =>
      hook.result.current.reportAnalysisRendered(analysis, null, tableIdentity),
    );
    const element = (
      key: string,
      {
        tableIdentity,
        play,
      }: {
        readonly tableIdentity: TableIdentity;
        readonly play: typeof expectedPlayPointsTable;
      },
      hand = HAND,
    ) => (
      <ScoredPossibleKeepDiscards
        cribRole={CribRole.Dealer}
        cribUncertaintySource={noUncertainty}
        dealtCards={handOf(hand)}
        key={key}
        loadCribTable={() => Promise.resolve(expectedCribPointsTable)}
        loadPlayTable={() => Promise.resolve(play)}
        onAnalysisRendered={report}
        onScoreSortKeyChange={jest.fn()}
        onStatusChange={jest.fn()}
        playUncertaintySource={noUncertainty}
        scoreSortKey={ScoredKeepDiscardSortKey.ExpectedNetPoints}
        sortOrder={SortOrder.DealOrder}
        tableIdentity={tableIdentity}
      />
    );
    const view = render(
      element("A", { play: expectedPlayPointsTable, tableIdentity: identity }),
    );
    await waitFor(
      () =>
        expect(
          readTallyForDisplay().records[0]?.expectedPointsLoss,
        ).toBeGreaterThan(0),
      waitForAnalysis,
    );
    const [original] = readTallyForDisplay().records;

    view.rerender(element("B", { play: playB, tableIdentity: identityB }));
    await waitFor(
      () =>
        expect(report).toHaveBeenLastCalledWith(
          expect.objectContaining({
            quality: expect.objectContaining({
              expectedPointsLoss: 0,
              isOptimal: true,
            }),
          }),
          identityB,
        ),
      waitForAnalysis,
    );

    expect(readTallyForDisplay().records).toStrictEqual([original]);

    noteOrigin(hook.result.current, OTHER_HAND, "deal");
    hook.rerender({ dealtCards: handOf(OTHER_HAND) });
    view.rerender(
      element(
        "new B hand",
        { play: playB, tableIdentity: identityB },
        OTHER_HAND,
      ),
    );
    await waitFor(
      () => expect(readTallyForDisplay().records).toHaveLength(2),
      waitForAnalysis,
    );

    expect(
      readTallyForDisplay().records.map((row) => row.tableIdentity),
    ).toStrictEqual([identity, identityB]);
  });
  /* jscpd:ignore-end */

  it.each([identity, null])(
    "reports the injected means pair identity %j rather than the shipped cache",
    async (tableIdentity: TableIdentity | null) => {
      const report = jest.fn();
      render(
        <ScoredPossibleKeepDiscards
          cribRole={CribRole.Dealer}
          cribUncertaintySource={noUncertainty}
          dealtCards={toDealtCards(
            parseHand("AH,2H,3H,4H,5H,6H"),
            parseHand("AH,2H"),
          )}
          loadCribTable={() => Promise.resolve(expectedCribPointsTable)}
          loadPlayTable={() => Promise.resolve(expectedPlayPointsTable)}
          onAnalysisRendered={report}
          onScoreSortKeyChange={jest.fn()}
          onStatusChange={jest.fn()}
          playUncertaintySource={noUncertainty}
          scoreSortKey={ScoredKeepDiscardSortKey.ExpectedNetPoints}
          sortOrder={SortOrder.DealOrder}
          tableIdentity={tableIdentity}
        />,
      );
      await waitFor(
        () =>
          expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
              quality: expect.objectContaining({
                expectedPointsLoss: expect.any(Number),
              }),
            }),
            tableIdentity,
          ),
        waitForAnalysis,
      );

      expect(report).toHaveBeenCalledTimes(1);
    },
  );
});
