/* eslint-disable sort-keys */
export const Rank = {
  ACE: 0,
  TWO: 1,
  THREE: 2,
  FOUR: 3,
  FIVE: 4,
  SIX: 5,
  SEVEN: 6,
  EIGHT: 7,
  NINE: 8,
  TEN: 9,
  JACK: 10,
  QUEEN: 11,
  KING: 12,
} as const;
/* eslint-enable sort-keys */

export type Rank = (typeof Rank)[keyof typeof Rank];

export const RANK_NAMES = Object.keys(Rank).map(
  (name) => name[0] + name.slice(1).toLowerCase(),
);

export interface RankedCard {
  rank: Rank;
}

export interface CountedCard {
  count: number;
}

export interface Card extends RankedCard, CountedCard {
  rankLabel: string;
}

export const MAXIMUM_CARD_COUNTING_VALUE = 10;
export const CARD_LABELS = [..."A23456789".split(""), "10", ..."JQK".split("")];

export const createCard = (rank: Rank): Card => ({
  count: Math.min(rank + 1, MAXIMUM_CARD_COUNTING_VALUE),
  rank,
  // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
  rankLabel: CARD_LABELS[rank]!,
});

export const INDICES_PER_SUIT = 13;

export const CARD_RANKS: Rank[] = Object.values(Rank) as Rank[];

const RANKED_CARDS: readonly Card[] = CARD_RANKS.map(createCard);

type RankName = keyof typeof Rank;

type NamedCards = {
  [Property in RankName]: Card;
};

const NAMED_CARDS = Object.fromEntries(
  Object.entries(Rank).map(([name, value]) => [
    name,
    RANKED_CARDS[value as number],
  ]),
) as NamedCards;

type Cards = {
  [Property in RankName | number]: Card;
};

export const CARDS: Cards = {
  ...RANKED_CARDS,
  ...NAMED_CARDS,
};
