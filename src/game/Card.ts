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

export const Suit = {
  CLUBS: "♣",
  DIAMONDS: "♦",
  HEARTS: "♥",
  SPADES: "♠",
} as const;

export type Suit = (typeof Suit)[keyof typeof Suit];

export const SUITS: readonly Suit[] = Object.values(Suit);

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
  suit: Suit;
}

export const MAXIMUM_CARD_COUNTING_VALUE = 10;
export const CARD_LABELS = [..."A23456789".split(""), "10", ..."JQK".split("")];

export const createCard = (rank: Rank, suit: Suit): Card => ({
  count: Math.min(rank + 1, MAXIMUM_CARD_COUNTING_VALUE),
  rank,
  // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
  rankLabel: CARD_LABELS[rank]!,
  suit,
});

export const INDICES_PER_SUIT = 13;
export const SUITS_PER_DECK = 4;

export const CARD_RANKS: Rank[] = Object.values(Rank);

export const DECK: readonly Card[] = SUITS.flatMap((suit) =>
  CARD_RANKS.map((rank) => createCard(rank, suit)),
);

const RANKED_CARDS: readonly Card[] = CARD_RANKS.map((rank, index) =>
  createCard(rank, SUITS[index % SUITS.length]!),
);

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
