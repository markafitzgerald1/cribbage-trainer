import { useCallback, useState } from "react";
import type { RenderedAnalysis } from "./useDiscardTelemetry";

/*
 * Whether a recommendation has been on screen yet this session, so work the
 * sidecars' deferral rule holds back until then (#774's history judging) can
 * start. It stays true once set: the rule is about the first answer, not the
 * current one.
 */
export const useFirstRecommendation = (
  onAnalysisRendered: (analysis: RenderedAnalysis) => void,
) => {
  const [hasShownRecommendation, setHasShownRecommendation] = useState(false);
  const handleAnalysisRendered = useCallback(
    (analysis: RenderedAnalysis) => {
      setHasShownRecommendation(true);
      onAnalysisRendered(analysis);
    },
    [onAnalysisRendered],
  );
  return { handleAnalysisRendered, hasShownRecommendation };
};
