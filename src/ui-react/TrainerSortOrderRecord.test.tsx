/* jscpd:ignore-start */
import * as cribLoader from "../game/expectedCribPointsTableLoader";
import { clearDiscardTally, readTallyForDisplay } from "../ui/discardTally";
import {
  clickIndices,
  renderTrainerWithInitialProps,
  setAnalysisTables,
} from "./Trainer.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import { screen, waitFor } from "@testing-library/react";
import type { ExpectedCribPointsTable } from "../game/expectedCribPoints";
import { SortOrder } from "../ui/SortOrder";
import expectedCribPointsTableData from "../game/expectedCribPointsTable.json";
import userEvent from "@testing-library/user-event";
/* jscpd:ignore-end */

// Testing Library's one-second default is not governed by jest's testTimeout, and scoring a hand overran it on a loaded machine.
const waitUnderLoad = { timeout: 8000 };

const recordedSortOrder = () => readTallyForDisplay().records[0]?.sortOrder;

const startTrainer = (initialSortOrder: SortOrder) => {
  window.history.replaceState(null, "", "/");
  setAnalysisTables();
  clearDiscardTally();
  const user = userEvent.setup();
  // Whichever hand and role are dealt, the order they are shown in is the one under test.
  const view = renderTrainerWithInitialProps({ initialSortOrder });
  return { user, view };
};

/*
 * Holds the crib table back while the given interaction runs, the way a
 * slow first load does, then releases it and waits for the decision to be
 * recorded. Returns the sort order that record carries.
 */
const recordedWithTablesLoadingDuring = async (
  interact: () => Promise<void>,
) => {
  const held: { release?: () => void } = {};
  const heldCribTable = new Promise<ExpectedCribPointsTable>((resolve) => {
    held.release = () => {
      resolve(
        expectedCribPointsTableData as unknown as ExpectedCribPointsTable,
      );
    };
  });
  const spy = jest
    .spyOn(cribLoader, "loadTable")
    .mockReturnValue(heldCribTable);
  try {
    cribLoader.setTableSync(null);
    await interact();
    held.release?.();
    await waitFor(() => {
      expect(recordedSortOrder()).toBeDefined();
    }, waitUnderLoad);
    return recordedSortOrder();
  } finally {
    spy.mockRestore();
    setAnalysisTables();
  }
};

describe("the sort order a Trainer decision is recorded with", () => {
  /*
   * With the tables already loaded, the analysis renders in the same commit
   * that completes the discard, and its effect reports the score before any
   * effect of the tally's own runs. A capture taken in an effect would still
   * be empty then, and the record's idempotency would absorb every later
   * report, so the field would be lost for good. The hook-level suites
   * cannot see this: renderHook flushes effects before they report a score.
   */
  it("records the sort order shown when the discard completed with the tables already loaded", async () => {
    const { user, view } = startTrainer(SortOrder.Ascending);

    await clickIndices(view.getAllByRole, [0, 1], user);

    expect(recordedSortOrder()).toBe("ascending");
  });

  /*
   * Real history rather than a simulated popstate, because the defect lives
   * in which entries Trainer writes: deselecting a card pushes, while the
   * re-sort and selecting it again only replace that transient entry, so
   * Back goes straight from the completed ascending board to the completed
   * descending one with no incomplete render between them. Hand, role and
   * discard are identical on both, so nothing in the capture's key changes
   * across the restore.
   */
  it("records the order a Back restores onto an identical completed discard while the tables load", async () => {
    const { user, view } = startTrainer(SortOrder.Descending);

    const recorded = await recordedWithTablesLoadingDuring(async () => {
      await clickIndices(view.getAllByRole, [0, 1], user);
      // Held by element rather than position, because the re-sort moves it.
      const withdrawnCard = view.getAllByRole("checkbox")[1]!;
      await user.click(withdrawnCard);
      await user.click(screen.getByRole("radio", { name: "Ascending" }));
      await user.click(withdrawnCard);
      window.history.back();
      await waitFor(() => {
        expect(
          screen.queryByRole("radio", { checked: true, name: "Descending" }),
        ).not.toBeNull();
      }, waitUnderLoad);
    });

    expect(recorded).toBe("descending");
  });
});
