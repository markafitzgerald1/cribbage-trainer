/* jscpd:ignore-start */
import { expect, jest } from "@jest/globals";
import {
  expectedCribPointsTable,
  expectedPlayPointsTable,
} from "../analysis/analysis.test.common";
import { render, waitFor } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import type { RenderedAnalysis } from "./useDiscardTelemetry";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { SortOrder } from "../ui/SortOrder";
import { type UncertaintySource } from "../game/uncertaintyLoader";
import { deferredUncertainty } from "../game/uncertaintySidecar.test.common";
import { parseHand } from "../game/Card";
import { setTableSync as setPlayTableSync } from "../game/expectedPlayPointsTableLoader";
import { setTableSync } from "../game/expectedCribPointsTableLoader";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

// Ranking, sorting and reporting: no bound involved, so state it is absent rather than parse 1.2 MB per case.
export const noUncertainty = deferredUncertainty(null);

// Explicit because findBy/waitFor default to one second and testTimeout does not govern them (AGENTS.md).
export const waitForAnalysis = { timeout: 8000 };

/* jscpd:ignore-start */
export interface RenderOptions {
  readonly cribRole?: CribRole;
  readonly cribUncertaintySource?: UncertaintySource;
  readonly onAnalysisRendered?: (analysis: RenderedAnalysis) => void;
  readonly onScoreSortKeyChange?: (
    scoreSortKey: ScoredKeepDiscardSortKey,
  ) => void;
  readonly onStatusChange?: (statusText: string) => void;
  readonly playUncertaintySource?: UncertaintySource;
  readonly preload?: boolean;
  readonly scoreSortKey?: ScoredKeepDiscardSortKey;
}
/* jscpd:ignore-end */

export const renderScoredPossibleKeepDiscards = (
  dealtCards: DealtCard[],
  {
    cribRole = CribRole.Dealer,
    cribUncertaintySource = noUncertainty,
    onAnalysisRendered = jest.fn(),
    onScoreSortKeyChange = jest.fn(),
    onStatusChange = jest.fn(),
    playUncertaintySource = noUncertainty,
    preload = true,
    scoreSortKey = ScoredKeepDiscardSortKey.ExpectedNetPoints,
  }: RenderOptions = {},
) => {
  if (preload) {
    setTableSync(expectedCribPointsTable);
    setPlayTableSync(expectedPlayPointsTable);
  }

  return render(
    <ScoredPossibleKeepDiscards
      cribRole={cribRole}
      cribUncertaintySource={cribUncertaintySource}
      dealtCards={dealtCards}
      onAnalysisRendered={onAnalysisRendered}
      onScoreSortKeyChange={onScoreSortKeyChange}
      onStatusChange={onStatusChange}
      playUncertaintySource={playUncertaintySource}
      scoreSortKey={scoreSortKey}
      sortOrder={SortOrder.Ascending}
    />,
  );
};

export const renderHand = (
  cards: string,
  discards: string,
  options: RenderOptions = {},
) =>
  renderScoredPossibleKeepDiscards(
    toDealtCards(parseHand(cards), parseHand(discards)),
    options,
  );

/*
 * A sub-optimal verdict waits for both sidecars to settle (#774), so a caption
 * test has to wait for the caption rather than read it straight after render;
 * reading it early is the state the verdict exists to hide.
 */
export const findCaption = async (
  container: HTMLElement,
): Promise<HTMLElement> => {
  let caption: HTMLElement | null = null;
  await waitFor(() => {
    caption = container.querySelector("figcaption");

    expect(caption).not.toBeNull();
  }, waitForAnalysis);
  return caption as unknown as HTMLElement;
};
