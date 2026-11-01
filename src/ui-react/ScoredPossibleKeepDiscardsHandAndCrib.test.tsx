import {
  deferredUncertainty,
  uniformUncertainty,
} from "../game/uncertaintySidecar.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import {
  findCaption,
  noUncertainty,
  renderHand,
  scoredElement,
} from "./ScoredPossibleKeepDiscards.test.common";
import type { AnalysisRenderedHandler } from "./ScoredPossibleKeepDiscards";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import type { UncertaintySource } from "../game/uncertaintyLoader";
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

const rowValueByDiscard = (
  container: HTMLElement,
  readRow: (row: HTMLTableRowElement) => string | null,
): Record<string, string | null> =>
  Object.fromEntries(
    Array.from(container.querySelectorAll<HTMLTableRowElement>("tbody tr")).map(
      (row, index): [string, string | null] => [
        String(rowDiscardLabels(container)[index]),
        readRow(row),
      ],
    ),
  );

const rowDescription = (row: HTMLTableRowElement): string | null => {
  const descriptionId = row.getAttribute("aria-describedby");
  return descriptionId === null
    ? null
    : (document.getElementById(descriptionId)?.textContent ?? null);
};

const renderVerdict = async (
  scoreSortKey: ScoredKeepDiscardSortKey,
  uncertainty: UncertaintySource,
) => {
  const onAnalysisRendered = jest.fn<AnalysisRenderedHandler>();
  const onStatusChange = jest.fn<(statusText: string) => void>();
  const { container, unmount } = renderHand(HAND, HAND_AND_CRIB_BEST_DISCARD, {
    cribUncertaintySource: uncertainty,
    onAnalysisRendered,
    onStatusChange,
    playUncertaintySource: uncertainty,
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
    rowDescriptions: rowValueByDiscard(container, rowDescription),
    rowTitles: rowValueByDiscard(container, (row) => row.getAttribute("title")),
    spokenVerdict: onStatusChange.mock.calls
      .map(([statusText]) => statusText)
      .filter(Boolean)
      .at(-1),
    tiers: rowValueByDiscard(container, (row) =>
      row.getAttribute("data-highlight-tier"),
    ),
  };
  unmount();
  return verdict;
};

const renderBothSorts = async (uncertainty = noUncertainty) => ({
  byHandAndCrib: await renderVerdict(
    ScoredKeepDiscardSortKey.ExpectedHandAndCribPoints,
    uncertainty,
  ),
  byNet: await renderVerdict(
    ScoredKeepDiscardSortKey.ExpectedNetPoints,
    uncertainty,
  ),
});

describe("ranking by hand plus crib", () => {
  it.each([
    {
      name: "without uncertainty sidecars",
      uncertainty: noUncertainty,
      verdict: /^Sub-optimal/u,
    },
    {
      name: "with both sidecars loaded",
      uncertainty: deferredUncertainty(uniformUncertainty(1)),
      verdict: /simulation noise/iu,
    },
  ])(
    "leaves the verdict, tiers, admission and announcement on net $name",
    async ({ uncertainty, verdict }) => {
      const { byHandAndCrib, byNet } = await renderBothSorts(uncertainty);

      expect(byHandAndCrib.captionLabel).toMatch(verdict);
      expect(byHandAndCrib.spokenVerdict).toBe(byHandAndCrib.captionLabel);
      expect(byHandAndCrib.tiers[HAND_AND_CRIB_BEST_LABEL]).toBe("chosen");
      expect(byHandAndCrib.tiers[NET_BEST_LABEL]).toBe("equal-best");
      expect({ ...byHandAndCrib, hasNote: null }).toStrictEqual({
        ...byNet,
        hasNote: null,
      });
    },
  );

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
