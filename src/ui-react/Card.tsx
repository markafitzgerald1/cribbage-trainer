import { DealtCardsHook } from "./DealtCardsHook";
import React from "react";

export interface CardProps extends DealtCardsHook {
  readonly dealOrderIndex: number;
}

export class Card extends React.Component<CardProps> {
  handleClick = () => {
    const { dealtCards, dealOrderIndex, setDealtCards } = this.props;
    const newDealtCards = [...dealtCards];
    // eslint-disable-next-line security/detect-object-injection
    const newDealtCard = newDealtCards[dealOrderIndex]!;
    newDealtCard.kept = !newDealtCard.kept;
    setDealtCards(newDealtCards);
  };

  override render() {
    const { dealtCards, dealOrderIndex } = this.props;
    // eslint-disable-next-line security/detect-object-injection
    const { kept, rankLabel } = dealtCards[dealOrderIndex]!;
    return (
      <li
        className={`card${kept ? "" : " discarded"}`}
        onClick={this.handleClick}
      >
        {rankLabel}
      </li>
    );
  }
}
