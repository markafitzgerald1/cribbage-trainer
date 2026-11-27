import { MAXIMUM_CARD_COUNTING_VALUE, type Rank } from "./Card";

export const PONE = 0;
export const DEALER = 1;
export type Seat = typeof PONE | typeof DEALER;

export const GO = -1;
export const RESET = -2;
export type PeggingEvent = Rank | typeof GO | typeof RESET;

const THIRTY_ONE = 31;
const FIFTEEN = 15;
const COUNT_SCORE = 2;
const LAST_CARD_SCORE = 1;
const GO_SCORE = 1;
const MINIMUM_RUN = 3;
const HISTORY_KEY_EVENTS = 13;
const NIBBLE = 16;
const NOT_FOUND = -1;
const GO_TOKEN = 14;
const RESET_TOKEN = 15;

export interface PeggingState {
  readonly hands: readonly [readonly Rank[], readonly Rank[]];
  readonly next: Seat;
  readonly count: number;
  readonly passed: readonly [boolean, boolean];
  readonly lastPlayer: Seat | null;
  readonly sinceReset: readonly Rank[];
  readonly history: readonly PeggingEvent[];
  readonly points: readonly [number, number];
  readonly finished: boolean;
}

const countValue = (rank: Rank): number =>
  Math.min(rank + 1, MAXIMUM_CARD_COUNTING_VALUE);

const otherSeat = (seat: Seat): Seat => (seat === PONE ? DEALER : PONE);

const ascending = (ranks: readonly Rank[]): Rank[] =>
  [...ranks].sort((left, right) => left - right);

export const startPegging = (
  pone: readonly Rank[],
  dealer: readonly Rank[],
): PeggingState => ({
  count: 0,
  finished: false,
  hands: [ascending(pone), ascending(dealer)],
  history: [],
  lastPlayer: null,
  next: PONE,
  passed: [false, false],
  points: [0, 0],
  sinceReset: [],
});

const handOf = (state: PeggingState, seat: Seat): readonly Rank[] =>
  seat === PONE ? state.hands[0] : state.hands[1];

export const legalRanks = (state: PeggingState): Rank[] =>
  [...new Set(handOf(state, state.next))].filter(
    (rank) => state.count + countValue(rank) <= THIRTY_ONE,
  );

const isRun = (tail: readonly Rank[]): boolean =>
  new Set(tail).size === tail.length &&
  Math.max(...tail) - Math.min(...tail) === tail.length - 1;

export const runLength = (sinceReset: readonly Rank[], rank: Rank): number => {
  const cards = [...sinceReset, rank];
  const lengths = cards
    .map((_, start) => cards.slice(start))
    .filter((tail) => tail.length >= MINIMUM_RUN && isRun(tail))
    .map((tail) => tail.length);
  return Math.max(0, ...lengths);
};

export const pairScore = (sinceReset: readonly Rank[], rank: Rank): number => {
  const firstOther = [...sinceReset]
    .reverse()
    .findIndex((earlier) => earlier !== rank);
  const matching = firstOther === NOT_FOUND ? sinceReset.length : firstOther;
  // One pair scores 2, three of a kind 6 and four 12: n(n + 1) for n matches.
  return matching * (matching + 1);
};

function withSeat<T>(
  pair: readonly [T, T],
  seat: Seat,
  value: T,
): readonly [T, T] {
  return seat === PONE ? [value, pair[1]] : [pair[0], value];
}

const addPoints = (
  points: readonly [number, number],
  seat: Seat,
  score: number,
): readonly [number, number] =>
  withSeat(points, seat, (seat === PONE ? points[0] : points[1]) + score);

const reset = (state: PeggingState, toAct: Seat): PeggingState => ({
  ...state,
  count: 0,
  history: [...state.history, RESET],
  lastPlayer: null,
  next: toAct,
  passed: [false, false],
  sinceReset: [],
});

export const sayGo = (state: PeggingState): PeggingState => {
  if (state.finished || legalRanks(state).length > 0) {
    throw new Error("A go is only legal with no playable card");
  }
  const player = state.next;
  const other = otherSeat(player);
  const said: PeggingState = { ...state, history: [...state.history, GO] };
  const otherPassed = other === PONE ? state.passed[0] : state.passed[1];
  if (otherPassed) {
    if (state.lastPlayer === null) {
      throw new Error("A go pair needs a card played since the reset");
    }
    const scored: PeggingState = {
      ...said,
      points: addPoints(state.points, state.lastPlayer, GO_SCORE),
    };
    return reset(scored, otherSeat(state.lastPlayer));
  }
  return { ...said, next: other, passed: withSeat(state.passed, player, true) };
};

const removeOne = (hand: readonly Rank[], rank: Rank): Rank[] => {
  const position = hand.indexOf(rank);
  return [...hand.slice(0, position), ...hand.slice(position + 1)];
};

export const playRank = (state: PeggingState, rank: Rank): PeggingState => {
  if (state.finished || !legalRanks(state).includes(rank)) {
    throw new Error("That rank is not a legal play");
  }
  const player = state.next;
  const count = state.count + countValue(rank);
  const countScore =
    count === FIFTEEN || count === THIRTY_ONE ? COUNT_SCORE : 0;
  const hand = removeOne(handOf(state, player), rank);
  const hands = withSeat(state.hands, player, hand);
  const finished = hands[0].length === 0 && hands[1].length === 0;
  const lastCard = finished && count !== THIRTY_ONE ? LAST_CARD_SCORE : 0;
  const score =
    runLength(state.sinceReset, rank) +
    pairScore(state.sinceReset, rank) +
    countScore +
    lastCard;
  const played: PeggingState = {
    ...state,
    count,
    finished,
    hands,
    history: [...state.history, rank],
    lastPlayer: player,
    next: otherSeat(player),
    points: addPoints(state.points, player, score),
    sinceReset: [...state.sinceReset, rank],
  };
  return count === THIRTY_ONE && !finished
    ? reset(played, otherSeat(player))
    : played;
};

const historyToken = (event: PeggingEvent): number => {
  if (event === GO) {
    return GO_TOKEN;
  }
  if (event === RESET) {
    return RESET_TOKEN;
  }
  return event + 1;
};

export const historyKey = (history: readonly PeggingEvent[]): number => {
  if (history.length > HISTORY_KEY_EVENTS) {
    throw new Error("Policy histories hold at most 13 events");
  }
  return history.reduceRight<number>(
    (key, event) => key * NIBBLE + historyToken(event),
    0,
  );
};

// The solver also limits choices to a seat's first three cards.
// Two legal ranks already imply that, so it needs no separate check.
export const isPolicyDecision = (state: PeggingState): boolean =>
  legalRanks(state).length > 1;
