import {
  type DiscardDecisionRecord,
  type DiscardTallySummary,
  readTallyForDisplay,
  recordDiscardDecision,
} from "../ui/discardTally";
import { useCallback, useEffect, useRef } from "react";
import { SIDECAR_SETTLE_TIMEOUT_MS } from "./useUncertainty";
import { exactAdmission } from "../ui/recordedAdmission";
import { sameDecisionJudgment } from "../ui/tallyUpdates";

interface PendingDecision {
  readonly decision: DiscardDecisionRecord;
  readonly timer: ReturnType<typeof setTimeout>;
}

// The wait belongs to the recorded decision, so leaving its analysis cannot strand it.
export const useAdmissionRecording = (
  onWritten: (summary: DiscardTallySummary) => void,
): typeof recordDiscardDecision => {
  const abandoned = useRef(
    readTallyForDisplay().records.filter(
      (record) => record.recordedAdmission === "pending",
    ),
  );
  const pending = useRef(new Map<string, PendingDecision>());
  useEffect(() => {
    for (const decision of abandoned.current) {
      onWritten(
        recordDiscardDecision({
          ...decision,
          recordedAdmission: exactAdmission(decision.isOptimal),
        }),
      );
    }
    abandoned.current = [];
  }, [onWritten]);

  return useCallback(
    (decision) => {
      const waiting = pending.current.get(decision.handKey);
      const matching =
        waiting && sameDecisionJudgment(waiting.decision, decision);
      const captured = matching
        ? { ...decision, at: waiting.decision.at }
        : decision;
      const summary = recordDiscardDecision(captured);
      if (captured.recordedAdmission === "pending") {
        const stored = readTallyForDisplay().records.find(
          (record) =>
            record.handKey === captured.handKey &&
            record.at === captured.at &&
            record.recordedAdmission === "pending",
        );
        if (!waiting && stored) {
          const timer = setTimeout(() => {
            onWritten(
              recordDiscardDecision({
                ...stored,
                recordedAdmission: exactAdmission(stored.isOptimal),
              }),
            );
            pending.current.delete(stored.handKey);
          }, SIDECAR_SETTLE_TIMEOUT_MS);
          pending.current.set(stored.handKey, { decision: stored, timer });
        }
      } else if (matching) {
        clearTimeout(waiting.timer);
        pending.current.delete(decision.handKey);
      }
      return summary;
    },
    [onWritten],
  );
};
