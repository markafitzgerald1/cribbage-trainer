import * as classes from "./InteractiveHand.module.css";
import { DealButton } from "./DealButton";
import { DealtCard } from "../game/DealtCard";
import { Hand } from "./Hand";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";

interface InteractiveHandProps {
  readonly dealtCards: readonly DealtCard[];
  readonly onCardChange: (dealOrderIndex: number) => void;
  readonly sortOrder: SortOrder;
  readonly onSortOrderChange: (sortOrder: SortOrder) => void;
  readonly onDeal: () => void;
}

export function InteractiveHand({
  dealtCards,
  onCardChange,
  sortOrder,
  onSortOrderChange,
  onDeal,
}: InteractiveHandProps) {
  return (
    <div className={classes.interactiveHand}>
      <div className={classes.controls}>
        <SortOrderInput
          onChange={onSortOrderChange}
          sortOrder={sortOrder}
        />
        <DealButton onDeal={onDeal} />
      </div>
      <Hand
        dealtCards={dealtCards}
        onChange={onCardChange}
        sortOrder={sortOrder}
      />
    </div>
  );
}
