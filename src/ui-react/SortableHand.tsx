import * as classes from "./SortableHand.module.css";
import { DealtCard } from "../game/DealtCard";
import { Hand } from "./Hand";
import React from "react";
import { SortOrderInput } from "./SortOrderInput";
import { SortOrderInputProps } from "./SortOrderInputProps";

interface SortableHandProps extends SortOrderInputProps {
  readonly dealtCards: readonly DealtCard[];
  readonly setDealtCards: (dealtCards: readonly DealtCard[]) => void;
}

export class SortableHand extends React.Component<SortableHandProps> {
  handleCheckboxChange = (dealOrderIndex: number) => {
    const { dealtCards, setDealtCards } = this.props;
    const newDealtCards = [...dealtCards];
    // eslint-disable-next-line security/detect-object-injection
    const newDealtCard = newDealtCards[dealOrderIndex]!;
    newDealtCard.kept = !newDealtCard.kept;
    setDealtCards(newDealtCards);
  };

  override render() {
    const { dealtCards, setSortOrder, sortOrder } = this.props;
    return (
      <div className={classes.sortableHand}>
        <SortOrderInput
          setSortOrder={setSortOrder}
          sortOrder={sortOrder}
        />
        <Hand
          dealtCards={dealtCards}
          onChange={this.handleCheckboxChange}
          sortOrder={sortOrder}
        />
      </div>
    );
  }
}
