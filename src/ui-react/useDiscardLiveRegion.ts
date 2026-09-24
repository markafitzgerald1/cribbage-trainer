import type { DealtCard } from "../game/DealtCard";
import type { PracticeDrillPhase } from "./usePracticeDrill";
import { discardIsComplete } from "../game/discardIsComplete";
import { useState } from "react";

export interface DiscardLiveRegion {
  readonly handleStatusChange: (status: string) => void;
  readonly isAnalysisVisible: boolean;
  readonly liveRegionStatus: string;
}

export const useDiscardLiveRegion = (
  dealtCards: readonly DealtCard[],
  isDrillActive: boolean,
  drillPhase: PracticeDrillPhase,
): DiscardLiveRegion => {
  const [verdictStatus, setVerdictStatus] = useState("");
  const isAnalysisVisible =
    discardIsComplete(dealtCards) &&
    (!isDrillActive || drillPhase === "revealed");

  return {
    handleStatusChange: setVerdictStatus,
    isAnalysisVisible,
    liveRegionStatus: isAnalysisVisible ? verdictStatus : "",
  };
};
