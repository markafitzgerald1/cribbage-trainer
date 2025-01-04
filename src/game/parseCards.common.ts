import { CARD_LABELS, Card, CARDS as card } from "./Card";

export const parseCards = (keepSpecifier: string): Card[] =>
  keepSpecifier.length === 0
    ? []
    : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      keepSpecifier.split(",").map((rank) => card[CARD_LABELS.indexOf(rank)]!);
