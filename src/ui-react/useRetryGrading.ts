import { useCallback, useMemo, useRef } from "react";
import { SIDECAR_SETTLE_TIMEOUT_MS } from "./useUncertainty";
import type { SettledAdmission } from "../ui/recordedAdmission";

const PENDING_GRACE_MS = 250;

export type DeferredGrade = (
  settled: SettledAdmission,
  isSameDrill: boolean,
) => void;

interface PendingGrade {
  readonly drillId: number;
  readonly finish: (settled: SettledAdmission) => void;
  readonly handKey: string;
  readonly judge: () => SettledAdmission;
  timer: ReturnType<typeof setTimeout>;
}

/*
 * A retry whose verdict is still pending is graded when the verdict settles on screen, or by its own deadline if the analysis has left by then; leaving must not drop the attempt, or a miss would never reset the streak. The id ties a pending grade to the drill that made it. Starting the same hand again grades its earlier pending retry first, so attempts reach storage in the order they happened.
 */
export const useRetryGrading = () => {
  // Guards a single record per committed choice; onAnalysisRendered re-fires on every re-sort.
  const recorded = useRef(false);
  const drillId = useRef(0);
  const pending = useRef(new Set<PendingGrade>());
  const ownGrade = useCallback(
    (): PendingGrade | null =>
      [...pending.current].find((grade) => grade.drillId === drillId.current) ??
      null,
    [],
  );
  const release = useCallback((grade: PendingGrade) => {
    clearTimeout(grade.timer);
    pending.current.delete(grade);
  }, []);
  const start = useCallback(
    (handKey: string) => {
      for (const grade of [...pending.current]) {
        if (grade.handKey === handKey) {
          release(grade);
          grade.finish(grade.judge());
        }
      }
      recorded.current = false;
      drillId.current += 1;
    },
    [release],
  );
  const reset = useCallback(() => {
    recorded.current = false;
  }, []);
  const isRecorded = useCallback(() => recorded.current, []);
  const markRecorded = useCallback(() => {
    recorded.current = true;
  }, []);
  const settle = useCallback(() => {
    const grade = ownGrade();
    if (grade !== null) {
      release(grade);
    }
  }, [ownGrade, release]);
  const defer = useCallback(
    (handKey: string, judge: () => SettledAdmission, run: DeferredGrade) => {
      const ownerId = drillId.current;
      if (ownGrade() !== null) {
        return;
      }
      const grade: PendingGrade = {
        drillId: ownerId,
        finish: (settled) => {
          run(settled, drillId.current === ownerId);
        },
        handKey,
        judge,
        // The verdict is taken at the sidecars' own deadline; the grace only lets a retry still on screen settle and win first.
        timer: setTimeout(() => {
          const settled = judge();
          grade.timer = setTimeout(() => {
            pending.current.delete(grade);
            grade.finish(settled);
          }, PENDING_GRACE_MS);
        }, SIDECAR_SETTLE_TIMEOUT_MS),
      };
      pending.current.add(grade);
    },
    [ownGrade],
  );
  return useMemo(
    () => ({ defer, isRecorded, markRecorded, reset, settle, start }),
    [defer, isRecorded, markRecorded, reset, settle, start],
  );
};
