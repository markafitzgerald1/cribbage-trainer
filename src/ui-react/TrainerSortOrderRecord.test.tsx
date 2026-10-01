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
  const view = renderTrainerWithInitialProps({ initialSortOrder });
  return { user, view };
};

// Holds the crib table back while the interaction runs, then releases it and returns the sort order the recorded decision carries.
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

const travel = async (move: () => void, shownSortOrder: string) => {
  move();
  await waitFor(() => {
    expect(
      screen.queryByRole("radio", { checked: true, name: shownSortOrder }),
    ).not.toBeNull();
  }, waitUnderLoad);
};

const travelBy = (move: () => void) => (shownSortOrder: string) => async () => {
  await travel(move, shownSortOrder);
};

const back = travelBy(() => {
  window.history.back();
});

const forward = travelBy(() => {
  window.history.forward();
});

type StartedTrainer = ReturnType<typeof startTrainer>;

const chooseSort = async ({ user }: StartedTrainer, name: string) => {
  await user.click(screen.getByRole("radio", { name }));
};

const recordedAfterCompletingUnderDescending = async (
  rest: (started: StartedTrainer) => Promise<void>,
) => {
  const started = startTrainer(SortOrder.Descending);
  return recordedWithTablesLoadingDuring(async () => {
    await clickIndices(started.view.getAllByRole, [0, 1], started.user);
    await rest(started);
  });
};

describe("the sort order a Trainer decision is recorded with", () => {
  // With the tables loaded, the score is reported before any effect of the tally's own runs, so only a render-time capture survives; renderHook flushes effects first and cannot see this.
  it("records the sort order shown when the discard completed with the tables already loaded", async () => {
    const { user, view } = startTrainer(SortOrder.Ascending);

    await clickIndices(view.getAllByRole, [0, 1], user);

    expect(recordedSortOrder()).toBe("ascending");
  });

  // Real history, not a simulated popstate: Back goes straight from the completed ascending board to the completed descending one, and nothing in the capture's key changes.
  it("records the order a Back restores onto an identical completed discard while the tables load", async () => {
    const recorded = await recordedAfterCompletingUnderDescending(
      async (started) => {
        // Held by element rather than position, because the re-sort moves it.
        const withdrawnCard = started.view.getAllByRole("checkbox")[1]!;
        await started.user.click(withdrawnCard);
        await chooseSort(started, "Ascending");
        await started.user.click(withdrawnCard);
        await back("Descending")();
      },
    );

    expect(recorded).toBe("descending");
  });

  // Each re-sort pushes an entry written while the capture still held the completion's order; only the entry can say which shape a restore is.
  it.each([
    { name: "a Back", travels: [back("Ascending")] },
    {
      name: "a Back then a Forward",
      travels: [back("Ascending"), forward("DealOrder")],
    },
  ])(
    "records the completion order after two re-sorts and $name while the tables load",
    async ({ travels }) => {
      const recorded = await recordedAfterCompletingUnderDescending(
        async (started) => {
          await chooseSort(started, "Ascending");
          await chooseSort(started, "DealOrder");
          await travels.reduce(
            async (landed, step) => landed.then(step),
            Promise.resolve(),
          );
        },
      );

      expect(recorded).toBe("descending");
    },
  );
});
