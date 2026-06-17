import * as classes from "./InteractiveHand.module.css";
import {
  CribRole,
  type CribRole as CribRoleType,
} from "../game/expectedCribPoints";
import { DealButton } from "./DealButton";
import type { DealtCard } from "../game/DealtCard";
import { Hand } from "./Hand";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";

interface InteractiveHandProps {
  readonly cribRole: CribRoleType;
  readonly dealtCards: readonly DealtCard[];
  readonly onCardChange: (dealOrderIndex: number) => void;
  readonly sortOrder: SortOrder;
  readonly onSortOrderChange: (sortOrder: SortOrder) => void;
  readonly onDeal: () => void;
}

export function InteractiveHand({
  cribRole,
  dealtCards,
  onCardChange,
  sortOrder,
  onSortOrderChange,
  onDeal,
}: InteractiveHandProps) {
  const roleName = cribRole === CribRole.Dealer ? "Dealer" : "Pone";
  const roleContext =
    cribRole === CribRole.Dealer ? "your crib" : "opponent crib";

  return (
    <div className={classes.interactiveHand}>
      <div className={classes.controls}>
        <SortOrderInput
          onChange={onSortOrderChange}
          sortOrder={sortOrder}
        />
        <div className={classes.roleLabel}>
          <span className={classes.roleName}>{roleName}</span>
          <span className={classes.roleContext}>{roleContext}</span>
        </div>
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
