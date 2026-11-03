import type { AnalysisOrder, UrlAnalysisState } from "../ui/urlAnalysisState";
import { useCallback, useState } from "react";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";

export const useAnalysisSort = (
  initialKey: ScoredKeepDiscardSortKey | null,
  initialOrder: AnalysisOrder | null,
  markHistoryUpdate: () => void,
) => {
  const [scoreSortKey, setScoreSortKey] = useState(
    initialKey ?? ScoredKeepDiscardSortKey.ExpectedNetPoints,
  );
  const [analysisOrder, setAnalysisOrder] = useState<AnalysisOrder>(
    initialOrder ?? "descending",
  );
  const changeScoreSortKey = useCallback(
    (key: ScoredKeepDiscardSortKey) => {
      markHistoryUpdate();
      setAnalysisOrder(
        key === scoreSortKey && analysisOrder === "descending"
          ? "ascending"
          : "descending",
      );
      setScoreSortKey(key);
    },
    [analysisOrder, markHistoryUpdate, scoreSortKey],
  );
  const restoreAnalysisSort = useCallback((state: UrlAnalysisState) => {
    if (state.scoreSortKey !== null) {
      setScoreSortKey(state.scoreSortKey);
    }
    setAnalysisOrder(state.analysisOrder ?? "descending");
  }, []);
  return {
    analysisOrder,
    changeScoreSortKey,
    restoreAnalysisSort,
    scoreSortKey,
  };
};
