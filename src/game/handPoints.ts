import { type Card, type CountedCard, Rank, type RankedCard } from "./Card";
import { Combination, PowerSet } from "js-combinatorics";

const CARDS_PER_PAIR = 2;

export const HAND_POINTS = {
  DOUBLE_PAIRS_ROYALE: 12,
  FIFTEEN_EIGHT: 8,
  FIFTEEN_FOUR: 4,
  FIFTEEN_SIX: 6,
  FIFTEEN_TWO: 2,
  FLUSH_PER_CARD: 1,
  NOBS: 1,
  PAIR: 2,
  PAIRS_ROYALE: 6,
  RUN_PER_CARD: 1,
  TWO_PAIRS: 4,
} as const;

const pairsPoints = (keep: readonly RankedCard[]) =>
  [...new Combination(keep, CARDS_PER_PAIR)].filter(
    ([first, second]) => first?.rank === second?.rank,
  ).length * HAND_POINTS.PAIR;

const COUNT = {
  FIFTEEN: 15,
} as const;

const fifteensPoints = (keep: readonly CountedCard[]) =>
  [...new PowerSet(keep)].filter(
    (possibleFifteen) =>
      possibleFifteen
        .map((card) => card.count)
        .reduce((count1, count2) => count1 + count2, 0) === COUNT.FIFTEEN,
  ).length * HAND_POINTS.FIFTEEN_TWO;

/* eslint-disable sort-keys */
const RunLength = {
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
} as const;
/* eslint-enable sort-keys */

type RunLength = (typeof RunLength)[keyof typeof RunLength];

const runLengthPoints = (keep: readonly RankedCard[], runLength: RunLength) =>
  [...new Combination(keep, runLength)]
    .map((combination) => combination.map((card) => card.rank))
    .map((combination) =>
      [...combination].sort((rank1, rank2) => rank1 - rank2),
    )
    .filter((combination) =>
      combination
        .slice(1)
        // eslint-disable-next-line security/detect-object-injection
        .map((rank, index) => rank - (combination[index] as number))
        .every((diff) => diff === 1),
    ).length *
  HAND_POINTS.RUN_PER_CARD *
  runLength;

const runsPoints = (keep: readonly RankedCard[]) =>
  runLengthPoints(keep, RunLength.FIVE) ||
  runLengthPoints(keep, RunLength.FOUR) ||
  runLengthPoints(keep, RunLength.THREE);

const CARDS_PER_HAND = 4;
const CARDS_PER_HAND_WITH_CUT = 5;

const isUnique = (cards: readonly Card[]) =>
  new Set(cards.map((card) => `${card.rank}-${card.suit}`)).size ===
  cards.length;

const getHandAndCut = (keep: readonly Card[]) => {
  const hand = keep.slice(0, CARDS_PER_HAND);
  const [, , , , cutCard] = keep;
  return { cutCard, hand };
};

const flushesPoints = (keep: readonly Card[], isCrib: boolean) => {
  if (keep.length < CARDS_PER_HAND || !isUnique(keep)) {
    return 0;
  }
  const { hand } = getHandAndCut(keep);
  const firstSuit = hand[0]?.suit;
  const isHandFlush = hand.every((card) => card.suit === firstSuit);
  if (!isHandFlush) {
    return 0;
  }
  const [, , , , fifthCard] = keep;
  if (
    keep.length === CARDS_PER_HAND_WITH_CUT &&
    fifthCard?.suit === firstSuit
  ) {
    return CARDS_PER_HAND_WITH_CUT * HAND_POINTS.FLUSH_PER_CARD;
  }
  // A crib flush must run all the way to the starter, so four matching crib cards score nothing.
  return isCrib ? 0 : CARDS_PER_HAND * HAND_POINTS.FLUSH_PER_CARD;
};

const nobsPoints = (keep: readonly Card[]) => {
  if (keep.length !== CARDS_PER_HAND_WITH_CUT || !isUnique(keep)) {
    return 0;
  }
  const { cutCard, hand } = getHandAndCut(keep);
  const hasNobs = hand.some(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (card) => card.rank === Rank.JACK && card.suit === cutCard!.suit,
  );
  return hasNobs ? HAND_POINTS.NOBS : 0;
};

export interface HandPoints {
  fifteens: number;
  flushes: number;
  nobs: number;
  pairs: number;
  runs: number;
  total: number;
}
export interface HandPointsOptions {
  /*
   * Counts the four cards as a crib rather than a kept hand. Every category
   * scores alike except the flush, which the crib only earns when the starter
   * shares the suit; nothing else about the count depends on whose cards these
   * are.
   */
  readonly isCrib?: boolean;
}

export const handPoints = (
  keep: readonly Card[],
  { isCrib = false }: HandPointsOptions = {},
): HandPoints => {
  const pairs = pairsPoints(keep);
  const fifteens = fifteensPoints(keep);
  const runs = runsPoints(keep);
  const flushes = flushesPoints(keep, isCrib);
  const nobs = nobsPoints(keep);
  return {
    fifteens,
    flushes,
    nobs,
    pairs,
    runs,
    total: pairs + fifteens + runs + flushes + nobs,
  };
};
