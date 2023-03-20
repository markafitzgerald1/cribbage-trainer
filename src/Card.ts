export interface Card {
  rankLabel: string;
  rankValue: number;
  count: number;
}

const MAXIMUM_CARD_COUNTING_VALUE = 10;
const CARD_LABELS = "A23456789TJQK";

const createCard = (rankValue: number): Card => ({
  count: Math.min(rankValue + 1, MAXIMUM_CARD_COUNTING_VALUE),
  rankLabel: CARD_LABELS[rankValue]!,
  rankValue,
});

export const INDICES_PER_SUIT = 13;

const RANKED_CARDS: Card[] = [...Array(INDICES_PER_SUIT).keys()].map(
  createCard
);

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
  [...Array(INDICES_PER_SUIT).keys()]
    .map((value) => value as Rank)
    .map((value) => [Rank[value] as RankName, RANKED_CARDS[value]])
) as NamedCards;

type Cards = {
  [Property in RankName | number]: Card;
};

export const CARDS: Cards = {
  ...RANKED_CARDS,
  ...NAMED_CARDS,
};
