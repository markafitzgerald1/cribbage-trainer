import { DEALER, type Seat } from "./pegging";
import {
  type ScoredKeepDiscard,
  allScoredKeepDiscardsByExpectedNetScoreDescending,
} from "../analysis/analysis";
import type { Card } from "./Card";
import { CribRole } from "./expectedCribPoints";
import { dealHand } from "./dealHand";
import { getRemainingDeck } from "./getRemainingDeck";
import { loadTable as loadCribTable } from "./expectedCribPointsTableLoader";
import { loadTable as loadPlayTable } from "./expectedPlayPointsTableLoader";

export interface BotHandDeal {
  readonly playerSeat: Seat;
  readonly playerCards: readonly Card[];
  readonly botKeep: readonly Card[];
  readonly botDiscard: readonly Card[];
}

export const dealBotHand = async (playerSeat: Seat): Promise<BotHandDeal> => {
  const playerCards = dealHand(Math.random);
  const botCards = dealHand(Math.random, getRemainingDeck(playerCards));
  const [crib, play] = await Promise.all([loadCribTable(), loadPlayTable()]);
  const botRole = playerSeat === DEALER ? CribRole.Pone : CribRole.Dealer;
  // Six distinct cards always yield 15 candidates.
  // Give analysis only the bot's six to match the trainer's information.
  const candidates = allScoredKeepDiscardsByExpectedNetScoreDescending(
    botCards,
    botRole,
    { crib, play },
  );
  const best = candidates[0] as ScoredKeepDiscard<Card>;
  return {
    botDiscard: best.discard,
    botKeep: best.keep,
    playerCards,
    playerSeat,
  };
};
