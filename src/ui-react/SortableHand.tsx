import { DealtCard } from "../game/DealtCard";
import { Hand } from "./Hand";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";

interface SortableHandProps {
  readonly dealtCards: readonly DealtCard[];
  readonly onCardChange: (dealOrderIndex: number) => void;
  readonly sortOrder: SortOrder;
  readonly onSortOrderChange: (sortOrder: SortOrder) => void;
}

export function SortableHand({
  dealtCards,
  onCardChange,
  sortOrder,
  onSortOrderChange,
}: SortableHandProps) {
  return (
    <div>
      <SortOrderInput
        onChange={onSortOrderChange}
        sortOrder={sortOrder}
      />
      <Hand
        dealtCards={dealtCards}
        onChange={onCardChange}
        sortOrder={sortOrder}
      />
    </div>
  );
}
