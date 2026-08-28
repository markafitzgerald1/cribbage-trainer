import { sortCards, toComparableCards } from "../ui/sortCards";
import { type Card } from "../game/Card";
import { CardLabel } from "./CardLabel";
import { SortOrder } from "../ui/SortOrder";

export interface SortedCardLabelsProps {
  readonly cards: readonly Card[];
  readonly keyPrefix?: string;
  readonly sortOrder: SortOrder;
}

export function SortedCardLabels({
  cards,
  keyPrefix = "card",
  sortOrder,
}: SortedCardLabelsProps): React.JSX.Element {
  return (
    <>
      {sortCards(toComparableCards(cards), sortOrder).map((card) => (
        <CardLabel
          key={`${keyPrefix}-${card.suit}-${card.rank}`}
          rank={card.rank}
          suit={card.suit}
        />
      ))}
    </>
  );
}

SortedCardLabels.defaultProps = {
  keyPrefix: "card",
};
