import { type Card, Rank, isSamePhysicalCard } from "./Card";
import { type HandPoints, cribPoints, handPoints } from "./handPoints";
import {
  POLICY_DENOMINATOR,
  type PolicyShard,
  drawPolicyRank,
} from "./pegPolicyShard";
import {
  PONE,
  type PeggingState,
  type Seat,
  historyKey,
  legalRanks,
  playRank,
  sayGo,
  startPegging,
} from "./pegging";
import type { BotHandDeal } from "./botHandDeal";
import { CARDS_PER_DISCARD } from "./facts";
import { getRemainingDeck } from "./getRemainingDeck";
import { normalizePlayHandKey } from "./expectedPlayPoints";

const HEELS_POINTS = 2;
const UINT16_RANGE = 65_536;
const DRAW_LIMIT = UINT16_RANGE - (UINT16_RANGE % POLICY_DENOMINATOR);

interface CardPlay {
  readonly card: Card;
  readonly seat: Seat;
}

interface BotHandState {
  readonly crib: readonly Card[];
  readonly heels: number;
  readonly keeps: readonly [readonly Card[], readonly Card[]];
  readonly pegging: PeggingState;
  readonly playerSeat: Seat;
  readonly plays: readonly CardPlay[];
  readonly starter: Card;
}

export interface PlayingBotHand extends BotHandState {
  readonly kind: "pegging";
}

export interface BotHandResult extends BotHandState {
  readonly kind: "complete";
  readonly cribScore: HandPoints;
  readonly handScores: readonly [HandPoints, HandPoints];
  readonly totals: readonly [number, number];
}

export interface MissingBotPolicy {
  readonly kind: "missing-policy";
  readonly handKey: string;
  readonly history: number;
  readonly seat: Seat;
}

export type BotShardLookup = (
  seat: Seat,
  handKey: string,
) => PolicyShard | null | Promise<PolicyShard | null>;

type HandProgress = PlayingBotHand | BotHandResult;

export const startBotHand = (
  deal: BotHandDeal,
  discards: readonly Card[],
): PlayingBotHand => {
  const playerDiscard = deal.playerCards.filter((card) =>
    discards.some((discard) => isSamePhysicalCard(card, discard)),
  );
  if (
    discards.length !== CARDS_PER_DISCARD ||
    playerDiscard.length !== CARDS_PER_DISCARD
  ) {
    throw new Error("Discard two distinct cards from your deal");
  }
  const playerKeep = deal.playerCards.filter(
    (card) => !playerDiscard.includes(card),
  );
  const keeps: PlayingBotHand["keeps"] =
    deal.playerSeat === PONE
      ? [playerKeep, deal.botKeep]
      : [deal.botKeep, playerKeep];
  const crib = [...playerDiscard, ...deal.botDiscard];
  const deck = getRemainingDeck([...keeps[0], ...keeps[1], ...crib]);
  const starter = deck.at(Math.floor(Math.random() * deck.length)) as Card;
  return {
    crib,
    heels: starter.rank === Rank.JACK ? HEELS_POINTS : 0,
    keeps,
    kind: "pegging",
    pegging: startPegging(
      keeps[0].map((card) => card.rank),
      keeps[1].map((card) => card.rank),
    ),
    playerSeat: deal.playerSeat,
    plays: [],
    starter,
  };
};

const finishHand = (state: PlayingBotHand): BotHandResult => {
  const [pone, dealer] = state.keeps;
  const poneScore = handPoints([...pone, state.starter]);
  const dealerScore = handPoints([...dealer, state.starter]);
  const cribScore = cribPoints([...state.crib, state.starter]);
  return {
    ...state,
    cribScore,
    handScores: [poneScore, dealerScore],
    kind: "complete",
    totals: [
      state.pegging.points[0] + poneScore.total,
      state.pegging.points[1] +
        dealerScore.total +
        cribScore.total +
        state.heels,
    ],
  };
};

const remainingCards = (state: PlayingBotHand): readonly Card[] =>
  state.keeps[state.pegging.next].filter((card) =>
    state.plays.every((play) => !isSamePhysicalCard(play.card, card)),
  );

const pegCard = (state: PlayingBotHand, card: Card): HandProgress => {
  const played: PlayingBotHand = {
    ...state,
    pegging: playRank(state.pegging, card.rank),
    plays: [...state.plays, { card, seat: state.pegging.next }],
  };
  return played.pegging.finished ? finishHand(played) : played;
};

export const playBotHandCard = (
  state: PlayingBotHand,
  choice: Card,
): HandProgress => {
  if (state.pegging.next !== state.playerSeat) {
    throw new Error("It is the bot's turn");
  }
  const card = remainingCards(state).find((candidate) =>
    isSamePhysicalCard(candidate, choice),
  );
  if (!card) {
    throw new Error("Play a remaining card from your keep");
  }
  return pegCard(state, card);
};

const cryptoDraw = (): number => {
  const sample = new Uint16Array(1);
  // Reject the short tail so all policy buckets have equal probability.
  for (;;) {
    const draw = crypto.getRandomValues(sample).at(0) as number;
    if (draw < DRAW_LIMIT) {
      return draw % POLICY_DENOMINATOR;
    }
  }
};

// Advance one automatic turn so a caller can present each play and go.
export const advanceBotHand = async (
  state: PlayingBotHand,
  lookup: BotShardLookup,
): Promise<HandProgress | MissingBotPolicy> => {
  const legal = legalRanks(state.pegging);
  const [first] = legal;
  if (typeof first !== "number") {
    return { ...state, pegging: sayGo(state.pegging) };
  }
  const { next, history } = state.pegging;
  if (next === state.playerSeat) {
    throw new Error("The player must choose a card");
  }
  let rank = first;
  if (legal.length > 1) {
    const keep = next === PONE ? state.keeps[0] : state.keeps[1];
    const handKey = normalizePlayHandKey(keep);
    const key = historyKey(history);
    const row = (await lookup(next, handKey))?.lookup(key) ?? null;
    if (row === null) {
      return { handKey, history: key, kind: "missing-policy", seat: next };
    }
    rank = drawPolicyRank(row, legal, cryptoDraw());
  }
  // Legal ranks come from the same keep, so at least one such card remains.
  return pegCard(
    state,
    remainingCards(state).find((card) => card.rank === rank) as Card,
  );
};
