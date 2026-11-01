import { describe, expect, it, jest } from "@jest/globals";
import {
  findCaption,
  renderHand,
  scoredElement,
} from "./ScoredPossibleKeepDiscards.test.common";
import type { AnalysisRenderedHandler } from "./ScoredPossibleKeepDiscards";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { parseHand } from "../game/Card";
import { screen } from "@testing-library/react";
import { toDealtCards } from "../game/toDealtCards";

/*
 * As dealer, discarding A A ranks first by hand plus crib but not by net, so
 * a verdict read from the displayed order would call it optimal.
 */
const HAND = "AD,10C,5D,9H,KC,AS";
const HAND_AND_CRIB_BEST_DISCARD = "AD,AS";
const HAND_AND_CRIB_BEST_LABEL = "A♦ A♠";
const NET_BEST_LABEL = "K♣ 10♣";
const SORT_NOTE = "Ranked without pegging. Verdict still uses Net.";
const EXPAND_PREFIX = "Expand analysis for discard ";

const rowDiscardLabels = (container: HTMLElement): string[] =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>("tbody tr button"),
  ).map((button) =>
    String(button.getAttribute("aria-label")).replace(EXPAND_PREFIX, ""),
  );

const tiersByDiscard = (
  container: HTMLElement,
): Record<string, string | null> =>
  Object.fromEntries(
    Array.from(container.querySelectorAll<HTMLTableRowElement>("tbody tr")).map(
      (row, index): [string, string | null] => [
        String(rowDiscardLabels(container)[index]),
        row.getAttribute("data-highlight-tier"),
      ],
    ),
  );

const renderVerdict = async (scoreSortKey: ScoredKeepDiscardSortKey) => {
  const onAnalysisRendered = jest.fn<AnalysisRenderedHandler>();
  const onStatusChange = jest.fn<(statusText: string) => void>();
  const { container, unmount } = renderHand(HAND, HAND_AND_CRIB_BEST_DISCARD, {
    onAnalysisRendered,
    onStatusChange,
    scoreSortKey,
  });
  const caption = await findCaption(container);
  const [analysis, , admission, judgeAtDeadline] =
    onAnalysisRendered.mock.lastCall ?? [];
  const verdict = {
    admission,
    analysis,
    captionLabel: caption.getAttribute("aria-label"),
    hasNote: screen.queryByText(SORT_NOTE) !== null,
    judgment: judgeAtDeadline?.() ?? null,
    spokenVerdict: onStatusChange.mock.calls
      .map(([statusText]) => statusText)
      .filter(Boolean)
      .at(-1),
    tiers: tiersByDiscard(container),
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
  it("leaves the verdict, tiers, admission and announcement on net", async () => {
    const { byHandAndCrib, byNet } = await renderBothSorts();

    expect(byHandAndCrib.captionLabel).toMatch(/^Sub-optimal/u);
    expect(byHandAndCrib.spokenVerdict).toBe(byHandAndCrib.captionLabel);
    expect(byHandAndCrib.tiers[HAND_AND_CRIB_BEST_LABEL]).toBe("chosen");
    expect(byHandAndCrib.tiers[NET_BEST_LABEL]).toBe("equal-best");
    expect({ ...byHandAndCrib, hasNote: null }).toStrictEqual({
      ...byNet,
      hasNote: null,
    });
  });

  it("says the verdict still uses net only while ranked by hand plus crib", async () => {
    const { byHandAndCrib, byNet } = await renderBothSorts();

    expect([byNet.hasNote, byHandAndCrib.hasNote]).toStrictEqual([false, true]);
  });

  it("re-ranks the same hand when the sort changes after mount", async () => {
    const dealtCards = toDealtCards(
      parseHand(HAND),
      parseHand(HAND_AND_CRIB_BEST_DISCARD),
    );
    const { container, rerender } = renderHand(
      HAND,
      HAND_AND_CRIB_BEST_DISCARD,
    );
    await findCaption(container);
    const firstRowAfterSortingBy = (scoreSortKey: ScoredKeepDiscardSortKey) => {
      rerender(scoredElement(dealtCards, { scoreSortKey }));
      return rowDiscardLabels(container)[0];
    };

    expect([
      firstRowAfterSortingBy(
        ScoredKeepDiscardSortKey.ExpectedHandAndCribPoints,
      ),
      firstRowAfterSortingBy(ScoredKeepDiscardSortKey.ExpectedNetPoints),
    ]).toStrictEqual([HAND_AND_CRIB_BEST_LABEL, NET_BEST_LABEL]);
  });
});
