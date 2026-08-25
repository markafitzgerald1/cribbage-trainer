import { type ReactNode, useEffect } from "react";

/*
 * Stands in for ScoredPossibleKeepDiscards, which reports itself rendered
 * from a passive effect. Child passive effects run before the parent's, so
 * this is the reader that sees the telemetry hook's consent at its most
 * stale. It lives in its own module because one component per file is the
 * rule here, and the ordering under test needs a real child boundary.
 */
export function AnalysisReporter({
  onRendered,
  renderCount,
}: {
  readonly onRendered: () => void;
  readonly renderCount: number;
}): ReactNode {
  useEffect(() => {
    onRendered();
  }, [onRendered, renderCount]);
  return null;
}
