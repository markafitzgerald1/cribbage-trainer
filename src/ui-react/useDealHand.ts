import { type CribRole, randomCribRole } from "../game/expectedCribPoints";
import { useCallback, useEffect, useState } from "react";
import type { DealtCard } from "../game/DealtCard";
import type { ReportHandReplaced } from "./useAnalysisReporting";
import { dealHand } from "../game/dealHand";

export interface DealState {
  readonly cribRole: CribRole;
  readonly dealtCards: DealtCard[];
}

interface UseDealHandArgs {
  readonly generateRandomNumber: () => number;
  readonly markHistoryUpdate: () => void;
  readonly reportHandReplaced: ReportHandReplaced;
  readonly setDealState: (state: DealState) => void;
}

export interface DealHand {
  // The plain Deal button: swap in a fresh hand, no announcement.
  readonly deal: () => void;
  // Leaving the practice drill: deal a fresh hand and flag it for a few seconds.
  readonly dealForDrillExit: () => void;
  readonly freshHandNoticeShown: boolean;
}

// How long the board announces a fresh deal after "Exit drill" before the notice clears itself.
const FRESH_HAND_NOTICE_MS = 3000;

/*
 * The deal path, plus the self-clearing notice that "Exit drill" raises so the
 * board reads as "a fresh hand was dealt" rather than swapping one in
 * silently. Lifted out of `Trainer` to keep that component under
 * `max-statements`; the drill exit already routes through a caller-supplied
 * deal, which is where the notice attaches.
 */
export const useDealHand = ({
  generateRandomNumber,
  markHistoryUpdate,
  reportHandReplaced,
  setDealState,
}: UseDealHandArgs): DealHand => {
  const [freshHandNoticeShown, setFreshHandNoticeShown] = useState(false);

  const deal = useCallback(() => {
    markHistoryUpdate();
    // The deal draw is consumed before the role draw, matching the original helper's call order.
    const dealtCards = dealHand(generateRandomNumber);
    const state: DealState = {
      cribRole: randomCribRole(generateRandomNumber),
      dealtCards,
    };
    reportHandReplaced(state.dealtCards, "deal", state.cribRole);
    setDealState(state);
  }, [
    generateRandomNumber,
    markHistoryUpdate,
    reportHandReplaced,
    setDealState,
  ]);

  const dealForDrillExit = useCallback(() => {
    deal();
    setFreshHandNoticeShown(true);
  }, [deal]);

  useEffect(() => {
    if (!freshHandNoticeShown) {
      return () => {
        // Nothing is scheduled while the notice is hidden.
      };
    }
    const timer = setTimeout(() => {
      setFreshHandNoticeShown(false);
    }, FRESH_HAND_NOTICE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [freshHandNoticeShown]);

  return { deal, dealForDrillExit, freshHandNoticeShown };
};
