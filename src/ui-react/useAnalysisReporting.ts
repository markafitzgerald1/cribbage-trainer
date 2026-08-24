import {
  type DiscardTelemetry,
  type DiscardTelemetryProps,
  type HistoryHandScope,
  type RenderedAnalysis,
  useDiscardTelemetry,
} from "./useDiscardTelemetry";
import { type ReportHandOrigin, useDiscardTally } from "./useDiscardTally";
import type { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import type { DiscardTallySummary } from "../ui/discardTally";
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
}

// The tally also needs to know which hand a history restore names, which telemetry's own dealNonce-keyed signature has no reason to carry.
export type ReportHistoryNavigation = (
  dealtCards: readonly DealtCard[],
  entry: HistoryHandScope | null,
  cribRole: CribRole | null,
) => void;

export interface AnalysisReporting extends Omit<
  DiscardTelemetry,
  "reportHandReplaced" | "reportHistoryNavigation"
> {
  readonly reportHandReplaced: ReportHandOrigin;
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
  const { cribRole, dealtCards, isSeededSession, wasDeepLinked } = props;
  const tally = useDiscardTally({
    cribRole,
    dealtCards,
    isSeededSession,
    wasDeepLinked,
  });
  const {
    reportAnalysisRendered: reportAnalysisToTelemetry,
    reportHandReplaced: reportHandToTelemetry,
    reportHistoryNavigation: reportHistoryNavigationToTelemetry,
  } = telemetry;
  const {
    reportAnalysisRendered: addAnalysisToTally,
    reportHandOrigin,
    reportHandRestored,
    summary: tallySummary,
  } = tally;

  const reportAnalysisRendered = useCallback(
    (analysis: RenderedAnalysis) => {
      reportAnalysisToTelemetry(analysis);
      addAnalysisToTally(analysis);
    },
    [addAnalysisToTally, reportAnalysisToTelemetry],
  );

  const reportHandReplaced: ReportHandOrigin = useCallback(
    (cards, cause, role) => {
      reportHandToTelemetry(cards, cause);
      reportHandOrigin(cards, cause, role);
    },
    [reportHandOrigin, reportHandToTelemetry],
  );

  const reportHistoryNavigation: ReportHistoryNavigation = useCallback(
    (cards, entry, role) => {
      reportHistoryNavigationToTelemetry(cards, entry);
      reportHandRestored(cards, role);
    },
    [reportHandRestored, reportHistoryNavigationToTelemetry],
  );

  return {
    ...telemetry,
    reportAnalysisRendered,
    reportHandReplaced,
    reportHistoryNavigation,
    tallySummary,
  };
};
