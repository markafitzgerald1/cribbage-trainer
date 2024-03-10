import * as classes from "./PossibleHand.module.css";
import { ComparableCard, sortCards } from "../ui/sortCards";
import { CardLabel } from "./CardLabel";
import { SortOrder } from "../ui/SortOrder";

interface PossibleHandProps {
  readonly dealtCards: readonly ComparableCard[];
  readonly sortOrder: SortOrder;
}

export function PossibleHand({ dealtCards, sortOrder }: PossibleHandProps) {
  return (
    <span className={classes.keepDiscard}>
      {sortCards(dealtCards, sortOrder).map((dealtCard) => (
        <span
          className={`${classes.card}`}
          key={dealtCard.dealOrder}
        >
          <CardLabel rank={dealtCard.rank} />
        </span>
      ))}
    </span>
  );
}
