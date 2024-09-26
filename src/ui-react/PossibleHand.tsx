import * as classes from "./PossibleHand.module.css";
import { ComparableCard, sortCards } from "../ui/sortCards";
import { PossibleHandCard } from "./PossibleHandCard";
import { SortOrder } from "../ui/SortOrder";

interface PossibleHandProps {
  readonly dealtCards: readonly ComparableCard[];
  readonly sortOrder: SortOrder;
}

export function PossibleHand({ dealtCards, sortOrder }: PossibleHandProps) {
  return (
    <span className={classes.keepDiscard}>
      {sortCards(dealtCards, sortOrder).map((dealtCard) => (
        <PossibleHandCard
          key={dealtCard.dealOrder}
          rank={dealtCard.rank}
        />
      ))}
    </span>
  );
}
