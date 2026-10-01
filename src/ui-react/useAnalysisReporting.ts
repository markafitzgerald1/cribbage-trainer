import {
  type DiscardTelemetry,
  type DiscardTelemetryProps,
  type HandReplacementCause,
  type HistoryHandScope,
  type RenderedAnalysis,
  useDiscardTelemetry,
} from "./useDiscardTelemetry";
import {
  type DisplayedHandRelabeling,
  useDiscardTally,
} from "./useDiscardTally";
import type { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import type { DiscardTallySummary } from "../ui/discardTally";
import type { SortOrder } from "../ui/SortOrder";
import { useCallback } from "react";
// Extends rather than restates the telemetry surface, so a change there cannot leave this one describing a shape that no longer exists.
/*
 * The telemetry surface, plus what the tally needs on top of it. Replacing a
 * hand carries its crib role, because identity here is cards and role
 * together: the same six cards are a different decision under each.
 */
// Extends rather than restates, so a change to the telemetry props cannot leave this describing a shape that no longer exists.
export interface AnalysisReportingProps extends DiscardTelemetryProps {
  readonly cribRole: CribRole;
  // The sort order on screen right now, for the tally's capture.
  readonly sortOrder: SortOrder;
}

/*
 * Callers report a hand replacement, not an identifier: the fresh handId the
 * tally now needs to disambiguate a later restore is read from telemetry's
 * own scope at the moment of replacement, an internal wiring detail this
 * type deliberately does not expose.
 */
export type ReportHandReplaced = (
  cards: readonly DealtCard[],
  cause: HandReplacementCause,
  cribRole: CribRole,
) => void;

// What a restored history entry recorded, each half null when it recorded none; telemetry reads only the scope.
export interface RestoredHistoryEntry {
  readonly completionSortOrder: SortOrder | null;
  readonly handScope: HistoryHandScope | null;
}

// The tally also needs to know which hand a history restore names, which telemetry's own dealNonce-keyed signature has no reason to carry.
export type ReportHistoryNavigation = (
  dealtCards: readonly DealtCard[],
  entry: RestoredHistoryEntry,
  cribRole: CribRole | null,
) => void;

/*
 * The one asymmetry between the two readers, and the reason this signature
 * is not simply telemetry's. A practice drill can put a suit-relabeled
 * stand-in for a stored hand on the board, which the local tally has to undo
 * before it can say which decision was made (#809); telemetry has no use for
 * it and must not receive it, since its payloads are card-free and a suit
 * renaming is card data. Passing it beside the analysis rather than inside
 * `RenderedAnalysis` is what makes that structural instead of a rule someone
 * has to keep: the value never reaches the type telemetry consumes. Null
 * from every caller showing the cards it means.
 */
export type ReportAnalysisRendered = (
  analysis: RenderedAnalysis,
  displayedAs: DisplayedHandRelabeling | null,
) => void;

export interface AnalysisReporting extends Omit<
  DiscardTelemetry,
  "reportAnalysisRendered" | "reportHandReplaced" | "reportHistoryNavigation"
> {
  readonly completionSortOrder: SortOrder | null;
  readonly reportAnalysisRendered: ReportAnalysisRendered;
  readonly reportHandReplaced: ReportHandReplaced;
  readonly reportHistoryNavigation: ReportHistoryNavigation;
  readonly tallySummary: DiscardTallySummary;
}

/*
 * One render feeds two readers with different rules: telemetry only when the
 * user has consented to it, and the local tally always, because a personal
 * statistic kept on this device is not something consent gates. Joining them
 * here keeps that difference out of the components that render the analysis,
 * which should not have to know either rule.
 */
export const useAnalysisReporting = (
  props: AnalysisReportingProps,
): AnalysisReporting => {
  const telemetry = useDiscardTelemetry(props);
  const { cribRole, dealtCards, isSeededSession, sortOrder, wasDeepLinked } =
    props;
  const { currentHandScope } = telemetry;
  const tally = useDiscardTally({
    cribRole,
    dealtCards,
    handId: currentHandScope().handId,
    isSeededSession,
    sortOrder,
    wasDeepLinked,
  });
  const {
    reportAnalysisRendered: reportAnalysisToTelemetry,
    reportHandReplaced: reportHandToTelemetry,
    reportHistoryNavigation: reportHistoryNavigationToTelemetry,
  } = telemetry;
  const {
    completionSortOrder,
    reportAnalysisRendered: addAnalysisToTally,
    reportHandOrigin,
    reportHandRestored,
    summary: tallySummary,
  } = tally;

  const reportAnalysisRendered: ReportAnalysisRendered = useCallback(
    (analysis, displayedAs) => {
      reportAnalysisToTelemetry(analysis);
      addAnalysisToTally(analysis, displayedAs);
    },
    [addAnalysisToTally, reportAnalysisToTelemetry],
  );

  // Both reports hand the tally telemetry's scope as it stands after telemetry has handled the transition, since that fresh scope is what Trainer stamps onto the history entry.
  const reportHandReplaced: ReportHandReplaced = useCallback(
    (cards, cause, role) => {
      reportHandToTelemetry(cards, cause);
      reportHandOrigin(cards, cause, {
        cribRole: role,
        handId: currentHandScope().handId,
      });
    },
    [currentHandScope, reportHandOrigin, reportHandToTelemetry],
  );

  const reportHistoryNavigation: ReportHistoryNavigation = useCallback(
    (cards, entry, role) => {
      reportHistoryNavigationToTelemetry(cards, entry.handScope);
      const { handId } = currentHandScope();
      reportHandRestored(cards, {
        completionSortOrder: entry.completionSortOrder,
        cribRole: role,
        handId,
      });
    },
    [currentHandScope, reportHandRestored, reportHistoryNavigationToTelemetry],
  );

  return {
    ...telemetry,
    completionSortOrder,
    reportAnalysisRendered,
    reportHandReplaced,
    reportHistoryNavigation,
    tallySummary,
  };
};
