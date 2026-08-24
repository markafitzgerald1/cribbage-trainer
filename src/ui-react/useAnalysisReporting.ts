import {
  type DiscardTelemetry,
  type DiscardTelemetryProps,
  type RenderedAnalysis,
  useDiscardTelemetry,
} from "./useDiscardTelemetry";
import { type ReportHandOrigin, useDiscardTally } from "./useDiscardTally";
import type { CribRole } from "../game/expectedCribPoints";
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

export interface AnalysisReporting extends Omit<
  DiscardTelemetry,
  "reportHandReplaced"
> {
  readonly reportHandReplaced: ReportHandOrigin;
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
  } = telemetry;
  const {
    reportAnalysisRendered: addAnalysisToTally,
    reportHandOrigin,
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

  return {
    ...telemetry,
    reportAnalysisRendered,
    reportHandReplaced,
    tallySummary,
  };
};
