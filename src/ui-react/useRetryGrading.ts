import { useCallback, useMemo, useRef } from "react";
import { SIDECAR_SETTLE_TIMEOUT_MS } from "./useUncertainty";

const PENDING_GRACE_MS = 250;

interface PendingGrade {
  readonly drillId: number;
  readonly timer: ReturnType<typeof setTimeout>;
}

/*
 * A retry whose verdict is still pending is graded when the verdict settles on screen, or by its own deadline if the analysis has left by then; leaving must not drop the attempt, or a miss would never reset the streak. The id ties a pending grade to the drill that made it.
 */
export const useRetryGrading = () => {
  // Guards a single record per committed choice; onAnalysisRendered re-fires on every re-sort.
  const recorded = useRef(false);
  const drillId = useRef(0);
  const pending = useRef<PendingGrade | null>(null);
  const start = useCallback(() => {
    recorded.current = false;
    drillId.current += 1;
  }, []);
  const reset = useCallback(() => {
    recorded.current = false;
  }, []);
  const isRecorded = useCallback(() => recorded.current, []);
  const markRecorded = useCallback(() => {
    recorded.current = true;
  }, []);
  const settle = useCallback(() => {
    const { current } = pending;
    if (current !== null && current.drillId === drillId.current) {
      clearTimeout(current.timer);
      pending.current = null;
    }
  }, []);
  const defer = useCallback((run: (isSameDrill: boolean) => void) => {
    const ownerId = drillId.current;
    if (pending.current?.drillId === ownerId) {
      return;
    }
    // Later than the on-screen wait, so a retry still on screen settles there first and this is only the fallback once it has left.
    const grade: PendingGrade = {
      drillId: ownerId,
      timer: setTimeout(() => {
        pending.current = null;
        run(drillId.current === ownerId);
      }, SIDECAR_SETTLE_TIMEOUT_MS + PENDING_GRACE_MS),
    };
    pending.current = grade;
  }, []);
  return useMemo(
    () => ({ defer, isRecorded, markRecorded, reset, settle, start }),
    [defer, isRecorded, markRecorded, reset, settle, start],
  );
};
