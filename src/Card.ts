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

export const CARDS: Card[] = [...Array(INDICES_PER_SUIT).keys()].map(
  createCard
);

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
