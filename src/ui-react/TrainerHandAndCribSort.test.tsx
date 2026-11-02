/* jscpd:ignore-start */
import {
  clickIndices,
  startTrainerWithEmptyTally,
} from "./Trainer.test.common";
import { describe, expect, it } from "@jest/globals";
import { screen, waitFor } from "@testing-library/react";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { readTallyForDisplay } from "../ui/discardTally";
/* jscpd:ignore-end */

// Testing Library's one-second default is not governed by jest's testTimeout, and scoring a hand can overrun it on a loaded machine.
const waitUnderLoad = { timeout: 8000 };
const handAndCribSortState = () =>
  screen.getByRole("columnheader", { name: /H\+C/u }).getAttribute("aria-sort");

const untilRankedByHandAndCrib = () =>
  waitFor(() => {
    expect(handAndCribSortState()).toBe("descending");
  }, waitUnderLoad);

const decideUnder = async (
  initialScoreSortKey: ScoredKeepDiscardSortKey | null,
) => {
  const { user, view } = startTrainerWithEmptyTally({ initialScoreSortKey });
  await clickIndices(view.getAllByRole, [0, 1], user);
  await waitFor(() => {
    expect(readTallyForDisplay().records).toHaveLength(1);
  }, waitUnderLoad);
  return user;
};

describe("the H+C sort in a Trainer", () => {
  it("records a decision made while ranked by hand plus crib", async () => {
    await decideUnder(ScoredKeepDiscardSortKey.ExpectedHandAndCribPoints);

    expect(handAndCribSortState()).toBe("descending");
  });

  it("leaves the recorded tally alone when the sort switches to hand plus crib", async () => {
    const user = await decideUnder(null);
    const tallyBefore = readTallyForDisplay();

    await user.click(screen.getByRole("button", { name: /^H\+C:/u }));
    await untilRankedByHandAndCrib();

    expect(readTallyForDisplay()).toStrictEqual(tallyBefore);
  });

  it("writes the H+C sort to the URL and restores it on Back", async () => {
    const user = await decideUnder(null);
    await user.click(screen.getByRole("button", { name: /^H\+C:/u }));
    const urlRankedByHandAndCrib = window.location.search;
    await user.click(screen.getByRole("button", { name: /^Net:/u }));
    window.history.back();
    await untilRankedByHandAndCrib();

    expect(urlRankedByHandAndCrib).toContain("analysis-sort=show");
  });
});
