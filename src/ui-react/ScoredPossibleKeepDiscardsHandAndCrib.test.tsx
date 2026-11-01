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
import { fireEvent, screen } from "@testing-library/react";
import type { AnalysisRenderedHandler } from "./ScoredPossibleKeepDiscards";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import type { UncertaintySource } from "../game/uncertaintyLoader";
import { parseHand } from "../game/Card";
import { shippedTableIdentity } from "../game/tableIdentity";
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

// Everything a row says about the verdict, leaving out only its stripe, which follows its displayed position.
const rowVerdict = (row: HTMLTableRowElement): string =>
  JSON.stringify([
    row.getAttribute("aria-label"),
    row.getAttribute("data-highlight-tier"),
    row.getAttribute("data-is-earlier-choice"),
    row.getAttribute("title"),
    rowDescription(row),
  ]);

interface VerdictCase {
  readonly drillPreviousDiscard: string | null;
  readonly uncertainty: UncertaintySource;
}

const renderVerdict = async (
  scoreSortKey: ScoredKeepDiscardSortKey,
  { drillPreviousDiscard, uncertainty }: VerdictCase,
) => {
  const onAnalysisRendered = jest.fn<AnalysisRenderedHandler>();
  const onStatusChange = jest.fn<(statusText: string) => void>();
  const { container, unmount } = renderHand(HAND, HAND_AND_CRIB_BEST_DISCARD, {
    cribUncertaintySource: uncertainty,
    drillPreviousDiscard,
    onAnalysisRendered,
    onStatusChange,
    playUncertaintySource: uncertainty,
    scoreSortKey,
  });
  const caption = await findCaption(container);
  const [analysis, tableIdentity, admission, judgeAtDeadline] =
    onAnalysisRendered.mock.lastCall ?? [];
  const verdict = {
    // React's generated ids differ per mount and say nothing about the verdict.
    caption: caption.outerHTML.replace(/_r_\w+_/gu, "_id_"),
    hasNote: screen.queryByText(SORT_NOTE) !== null,
    reported: [analysis, tableIdentity, admission, judgeAtDeadline?.()],
    rows: rowValueByDiscard(container, rowVerdict),
    spokenVerdict: onStatusChange.mock.calls
      .map(([statusText]) => statusText)
      .filter(Boolean)
      .at(-1),
    tiers: rowValueByDiscard(container, (row) =>
      row.getAttribute("data-highlight-tier"),
    ),
  };
  const chosenExpandButton = screen.getByRole("button", {
    name: `${EXPAND_PREFIX}${HAND_AND_CRIB_BEST_LABEL}`,
  });
  fireEvent.click(chosenExpandButton);
  const expandedChosenRow =
    chosenExpandButton.closest("tr")?.nextElementSibling?.textContent;
  unmount();
  return {
    ...verdict,
    captionLabel: caption.getAttribute("aria-label"),
    expandedChosenRow,
  };
};

const NO_DRILL_NO_SIDECARS: VerdictCase = {
  drillPreviousDiscard: null,
  uncertainty: noUncertainty,
};

const renderBothSorts = async (verdictCase = NO_DRILL_NO_SIDECARS) => ({
  byHandAndCrib: await renderVerdict(
    ScoredKeepDiscardSortKey.ExpectedHandAndCribPoints,
    verdictCase,
  ),
  byNet: await renderVerdict(
    ScoredKeepDiscardSortKey.ExpectedNetPoints,
    verdictCase,
  ),
});

describe("ranking by hand plus crib", () => {
  it.each([
    {
      ...NO_DRILL_NO_SIDECARS,
      name: "without uncertainty sidecars",
      verdict: /^Sub-optimal/u,
    },
    {
      drillPreviousDiscard: null,
      name: "with both sidecars loaded",
      uncertainty: deferredUncertainty(uniformUncertainty(1)),
      verdict: /simulation noise/iu,
    },
    {
      drillPreviousDiscard: "KC,10C",
      name: "in a drill whose earlier discard was the net best",
      uncertainty: noUncertainty,
      verdict: /^Sub-optimal/u,
    },
  ])(
    "leaves everything the table says about the verdict on net $name",
    async ({ drillPreviousDiscard, uncertainty, verdict }) => {
      const { byHandAndCrib, byNet } = await renderBothSorts({
        drillPreviousDiscard,
        uncertainty,
      });

      expect(byHandAndCrib.captionLabel).toMatch(verdict);
      expect(byHandAndCrib.spokenVerdict).toBe(byHandAndCrib.captionLabel);
      expect(byHandAndCrib.tiers[HAND_AND_CRIB_BEST_LABEL]).toBe("chosen");
      expect(byHandAndCrib.reported[1]).toBe(shippedTableIdentity);
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
