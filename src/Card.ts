export interface RankedCard {
  rankValue: number;
}

export interface CountedCard {
  count: number;
}

export interface Card extends RankedCard, CountedCard {
  rankLabel: string;
}

const MAXIMUM_CARD_COUNTING_VALUE = 10;
const CARD_LABELS = "A23456789TJQK";

const createCard = (rankValue: number): Card => ({
  count: Math.min(rankValue + 1, MAXIMUM_CARD_COUNTING_VALUE),
  rankLabel: CARD_LABELS[rankValue]!,
  rankValue,
});

export const INDICES_PER_SUIT = 13;

const CARD_INDICES: readonly number[] = [...Array(INDICES_PER_SUIT).keys()];

const RANKED_CARDS: readonly Card[] = CARD_INDICES.map(createCard);

enum Rank {
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

type RankName = keyof typeof Rank;

type NamedCards = {
  [Property in RankName]: Card;
};

const NAMED_CARDS = Object.fromEntries(
  CARD_INDICES.map((index) => index as Rank).map((rank) => [
    Rank[rank] as RankName,
    RANKED_CARDS[rank],
  ])
) as NamedCards;

type Cards = {
  [Property in RankName | number]: Card;
};

export const CARDS: Cards = {
  ...RANKED_CARDS,
  ...NAMED_CARDS,
};
