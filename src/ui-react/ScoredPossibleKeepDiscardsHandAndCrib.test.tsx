import { describe, expect, it, jest } from "@jest/globals";
import {
  findCaption,
  renderHand,
} from "./ScoredPossibleKeepDiscards.test.common";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { screen } from "@testing-library/react";

/*
 * As dealer, discarding A A ranks first by hand plus crib but not by net, so
 * a verdict read from the displayed order would call it optimal.
 */
const HAND = "AD,10C,5D,9H,KC,AS";
const HAND_AND_CRIB_BEST_DISCARD = "AD,AS";
const SORT_NOTE = "Ranked without pegging. Verdict still uses Net.";

const renderVerdict = async (scoreSortKey: ScoredKeepDiscardSortKey) => {
  const onAnalysisRendered = jest.fn();
  const { container, unmount } = renderHand(HAND, HAND_AND_CRIB_BEST_DISCARD, {
    onAnalysisRendered,
    scoreSortKey,
  });
  const caption = await findCaption(container);
  const verdict = {
    captionLabel: caption.getAttribute("aria-label"),
    firstRowTitle: container.querySelector("tbody tr")?.getAttribute("title"),
    hasNote: screen.queryByText(SORT_NOTE) !== null,
    reportedAnalysis: onAnalysisRendered.mock.lastCall?.[0],
  };
  unmount();
  return verdict;
};

const renderBothSorts = async () => ({
  byHandAndCrib: await renderVerdict(
    ScoredKeepDiscardSortKey.ExpectedHandAndCribPoints,
  ),
  byNet: await renderVerdict(ScoredKeepDiscardSortKey.ExpectedNetPoints),
});

describe("ranking by hand plus crib", () => {
  it("leaves the verdict and the reported analysis on net", async () => {
    const { byHandAndCrib, byNet } = await renderBothSorts();

    expect(byHandAndCrib.captionLabel).toMatch(/^Sub-optimal/u);
    expect(byHandAndCrib.firstRowTitle).toMatch(/^Chosen discard/u);
    expect(byHandAndCrib.captionLabel).toBe(byNet.captionLabel);
    expect(byHandAndCrib.reportedAnalysis).toStrictEqual(
      byNet.reportedAnalysis,
    );
  });

  it("says the verdict still uses net only while ranked by hand plus crib", async () => {
    const { byHandAndCrib, byNet } = await renderBothSorts();

    expect([byNet.hasNote, byHandAndCrib.hasNote]).toStrictEqual([false, true]);
  });
});
