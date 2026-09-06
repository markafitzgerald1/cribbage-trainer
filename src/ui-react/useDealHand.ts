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
  // The board as it stands, so the notice retracts once a Back or an entered hand replaces the freshly dealt one.
  readonly dealtCards: readonly DealtCard[];
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
  dealtCards,
  generateRandomNumber,
  markHistoryUpdate,
  reportHandReplaced,
  setDealState,
}: UseDealHandArgs): DealHand => {
  /*
   * The notice is tied to the exact hand the drill exit dealt, not a boolean:
   * a second exit within the window re-arms the 3s timer because a fresh
   * hand is a new array reference (the effect dependency changes), and a Back or an
   * Enter-cards hand that swaps the board to any other reference retracts it.
   */
  const [freshHandNoticeCards, setFreshHandNoticeCards] = useState<
    readonly DealtCard[] | null
  >(null);

  const deal = useCallback((): DealState => {
    markHistoryUpdate();
    // The deal draw is consumed before the role draw, matching the original helper's call order.
    const nextCards = dealHand(generateRandomNumber);
    const state: DealState = {
      cribRole: randomCribRole(generateRandomNumber),
      dealtCards: nextCards,
    };
    // A plain Deal is silent; drop any lingering "Exit drill" notice.
    setFreshHandNoticeCards(null);
    reportHandReplaced(state.dealtCards, "deal", state.cribRole);
    setDealState(state);
    return state;
  }, [
    generateRandomNumber,
    markHistoryUpdate,
    reportHandReplaced,
    setDealState,
  ]);

  const dealForDrillExit = useCallback(() => {
    setFreshHandNoticeCards(deal().dealtCards);
  }, [deal]);

  useEffect(() => {
    if (freshHandNoticeCards === null) {
      return () => {
        // Nothing is scheduled while the notice is hidden.
      };
    }
    const timer = setTimeout(() => {
      setFreshHandNoticeCards(null);
    }, FRESH_HAND_NOTICE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [freshHandNoticeCards]);

  /*
   * A Back or an Enter-cards hand swaps the board without routing through
   * `deal`, so the "fresh hand dealt" line would otherwise sit over a
   * restored or typed hand until its timer lapses. Retract it the moment the
   * board stops being the hand the notice was raised for. Render-time,
   * mirroring usePracticeDrill's own reset.
   */
  if (freshHandNoticeCards !== null && freshHandNoticeCards !== dealtCards) {
    setFreshHandNoticeCards(null);
  }

  return {
    deal,
    dealForDrillExit,
    freshHandNoticeShown: freshHandNoticeCards !== null,
  };
};
