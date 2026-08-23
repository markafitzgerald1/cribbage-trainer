import {
  type DiscardTelemetry,
  type DiscardTelemetryProps,
  type HandReplacementCause,
  type RenderedAnalysis,
  useDiscardTelemetry,
} from "./useDiscardTelemetry";
import type { DealtCard } from "../game/DealtCard";
import type { DiscardTallySummary } from "../ui/discardTally";
import { useCallback } from "react";
import { useDiscardTally } from "./useDiscardTally";

// Extends rather than restates the telemetry surface, so a change there cannot leave this one describing a shape that no longer exists.
export interface AnalysisReporting extends DiscardTelemetry {
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
  props: DiscardTelemetryProps,
): AnalysisReporting => {
  const telemetry = useDiscardTelemetry(props);
  const { dealtCards, isSeededSession, wasDeepLinked } = props;
  const tally = useDiscardTally({ dealtCards, isSeededSession, wasDeepLinked });
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

  const reportHandReplaced = useCallback(
    (cards: readonly DealtCard[], cause: HandReplacementCause) => {
      reportHandToTelemetry(cards, cause);
      reportHandOrigin(cards, cause);
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
