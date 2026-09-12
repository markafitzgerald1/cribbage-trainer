import type { Card } from "./Card";
import { CribRole } from "./expectedCribPoints";
import type { HandCut } from "./cutStarter";
import { handPoints } from "./handPoints";

/*
 * What one discard actually counted on one starter. Hand and crib only:
 * pegging is out of scope here, so nothing in this module may be read as a
 * whole-hand score.
 */
export interface CutCounts {
  readonly cribPoints: number;
  readonly handPoints: number;
  // Signed the way the analysis table signs its Crib column: the pone's crib points count against them.
  readonly signedCribPoints: number;
  readonly total: number;
}

export interface CutCountsOptions extends HandCut {
  readonly cribRole: CribRole;
  readonly discard: readonly Card[];
  readonly keep: readonly Card[];
}

/*
 * Exact counts from the existing enumeration-based scorer, on concrete cards.
 * There is no estimation here and no expected-value machinery: the starter is
 * one card, the crib is four cards, and both counts are what a player would
 * peg on the board.
 */
export const cutCounts = ({
  cribRole,
  discard,
  keep,
  opponentCribCards,
  starter,
}: CutCountsOptions): CutCounts => {
  const hand = handPoints([...keep, starter]).total;
  const crib = handPoints([...discard, ...opponentCribCards, starter], {
    isCrib: true,
  }).total;
  const signedCribPoints = cribRole === CribRole.Dealer ? crib : -crib;
  return {
    cribPoints: crib,
    handPoints: hand,
    signedCribPoints,
    total: hand + signedCribPoints,
  };
};
