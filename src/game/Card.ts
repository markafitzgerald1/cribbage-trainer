export enum Rank {
  ACE,
  TWO,
  THREE,
  FOUR,
  FIVE,
  SIX,
  SEVEN,
  EIGHT,
  NINE,
  TEN,
  JACK,
  QUEEN,
  KING,
}

export const RANK_NAMES = Object.keys(Rank)
  .filter((key: string) => isNaN(Number(key)))
  .map((name) => name[0] + name.slice(1).toLowerCase());

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
  // eslint-disable-next-line security/detect-object-injection
  rankLabel: CARD_LABELS[rank]!,
});

export const INDICES_PER_SUIT = 13;

export const CARD_RANKS: Rank[] = Object.values(Rank).filter(
  Number.isInteger,
) as Rank[];

const RANKED_CARDS: readonly Card[] = CARD_RANKS.map(createCard);

type RankName = keyof typeof Rank;

type NamedCards = {
  [Property in RankName]: Card;
};

const NAMED_CARDS = Object.fromEntries(
  CARD_RANKS.map((rank) => [
    // eslint-disable-next-line security/detect-object-injection
    Rank[rank] as RankName,
    // eslint-disable-next-line security/detect-object-injection
    RANKED_CARDS[rank],
  ]),
) as NamedCards;

type Cards = {
  [Property in RankName | number]: Card;
};

export const CARDS: Cards = {
  ...RANKED_CARDS,
  ...NAMED_CARDS,
};
