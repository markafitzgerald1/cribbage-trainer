import * as classes from "./SortableHand.module.css";
import { DealtCard } from "../game/DealtCard";
import { Hand } from "./Hand";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";

interface SortableHandProps {
  readonly dealtCards: readonly DealtCard[];
  readonly setDealtCards: (dealtCards: readonly DealtCard[]) => void;
  readonly sortOrder: SortOrder;
  readonly setSortOrder: (sort: SortOrder) => void;
}

export class SortableHand extends React.Component<SortableHandProps> {
  handleSortOrderChange = (sortOrder: SortOrder) => {
    const { setSortOrder } = this.props;
    setSortOrder(sortOrder);
  };

  handleHandCardChange = (dealOrderIndex: number) => {
    const { dealtCards, setDealtCards } = this.props;
    const newDealtCards = [...dealtCards];
    // eslint-disable-next-line security/detect-object-injection
    const newDealtCard = newDealtCards[dealOrderIndex]!;
    newDealtCard.kept = !newDealtCard.kept;
    setDealtCards(newDealtCards);
  };

  override render() {
    const { dealtCards, sortOrder } = this.props;
    return (
      <div className={classes.sortableHand}>
        <SortOrderInput
          onChange={this.handleSortOrderChange}
          sortOrder={sortOrder}
        />
        <Hand
          dealtCards={dealtCards}
          onChange={this.handleHandCardChange}
          sortOrder={sortOrder}
        />
      </div>
    );
  }
}
