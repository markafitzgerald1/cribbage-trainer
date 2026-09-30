/* jscpd:ignore-start */
import { clearDiscardTally, readTallyForDisplay } from "../ui/discardTally";
import {
  clickIndices,
  renderTrainerWithInitialProps,
  setAnalysisTables,
} from "./Trainer.test.common";
import { describe, expect, it } from "@jest/globals";
import { SortOrder } from "../ui/SortOrder";
import userEvent from "@testing-library/user-event";
/* jscpd:ignore-end */

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
    window.history.replaceState(null, "", "/");
    setAnalysisTables();
    clearDiscardTally();
    const user = userEvent.setup();
    // Whichever hand and role are dealt, the order they are shown in is the one under test.
    const view = renderTrainerWithInitialProps({
      initialSortOrder: SortOrder.Ascending,
    });

    await clickIndices(view.getAllByRole, [0, 1], user);

    expect(readTallyForDisplay().records[0]?.sortOrder).toBe("ascending");
  });
});
