import { type DeadlineJudgment, exactAdmission } from "../ui/recordedAdmission";
import {
  type DiscardDecisionRecord,
  type DiscardTallySummary,
  readDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
} from "../ui/discardTally";
import { useCallback, useEffect, useRef } from "react";
import { SIDECAR_SETTLE_TIMEOUT_MS } from "./useUncertainty";
import { sameDecisionJudgment } from "../ui/tallyUpdates";

/*
 * The owner's timer starts when it records the row, a moment after the row's
 * own `at`. A hidden owner tab whose timer the browser throttles past this
 * grace still loses the race, and its decision settles as an exact fallback.
 */
export const RECOVERY_GRACE_MS = 1000;

interface PendingDecision {
  readonly decision: DiscardDecisionRecord;
  readonly timer: ReturnType<typeof setTimeout>;
}

const pendingKey = (decision: DiscardDecisionRecord): string =>
  `${decision.handKey}|${decision.isPractice}`;

const settleExactly = (decision: DiscardDecisionRecord): DiscardTallySummary =>
  recordDiscardDecision({
    ...decision,
    recordedAdmission: exactAdmission(decision.isOptimal),
  });

export type RecordDecision = (
  decision: DiscardDecisionRecord,
  judgeAtDeadline?: DeadlineJudgment | null,
) => DiscardTallySummary;

// The wait belongs to the recorded decision, so leaving its analysis cannot strand it.
export const useAdmissionRecording = (
  onWritten: (summary: DiscardTallySummary) => void,
): RecordDecision => {
  // Read in the effect rather than during render, which re-parsed the whole tally on every render.
  const hasRecoveredStored = useRef(false);
  const pending = useRef(new Map<string, PendingDecision>());
  useEffect(() => {
    if (hasRecoveredStored.current) {
      return;
    }
    hasRecoveredStored.current = true;
    for (const decision of readTallyForDisplay().records) {
      if (decision.recordedAdmission === "pending") {
        /*
         * A pending row may belong to another tab, or to this tab before a
         * reload, that is still waiting on its sidecars. Settling it now
         * would steal that judgment, so it waits out the owner's own
         * deadline, measured from the row's `at` on the same Date.now clock
         * plus a grace so a live owner's judgment lands first; a row still
         * pending after that has no owner left to settle it.
         */
        const remaining =
          decision.at +
          SIDECAR_SETTLE_TIMEOUT_MS +
          RECOVERY_GRACE_MS -
          Date.now();
        const settle = () => {
          settleExactly(decision);
          onWritten(readDiscardTally(Date.now()));
        };
        if (remaining > 0) {
          setTimeout(settle, remaining);
        } else {
          settle();
        }
      }
    }
  }, [onWritten]);

  return useCallback(
    (decision, judgeAtDeadline = null) => {
      const key = pendingKey(decision);
      const waiting = pending.current.get(key);
      const matching =
        waiting && sameDecisionJudgment(waiting.decision, decision);
      const captured = matching
        ? { ...decision, at: waiting.decision.at }
        : decision;
      const summary = recordDiscardDecision(captured);
      if (captured.recordedAdmission === "pending") {
        const stored = readTallyForDisplay().records.find(
          (record) =>
            sameDecisionJudgment(record, captured) &&
            record.at === captured.at &&
            record.recordedAdmission === "pending",
        );
        if (!waiting && stored) {
          const timer = setTimeout(() => {
            recordDiscardDecision({
              ...stored,
              recordedAdmission:
                judgeAtDeadline === null
                  ? exactAdmission(stored.isOptimal)
                  : judgeAtDeadline(),
            });
            onWritten(readDiscardTally(Date.now()));
            pending.current.delete(key);
          }, SIDECAR_SETTLE_TIMEOUT_MS);
          pending.current.set(key, { decision: stored, timer });
        }
      } else if (matching) {
        clearTimeout(waiting.timer);
        pending.current.delete(key);
      }
      return summary;
    },
    [onWritten],
  );
};
