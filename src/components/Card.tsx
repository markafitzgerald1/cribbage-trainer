import { DealtCardsHook } from "./DealtCardsHook";
import React from "react";

export interface CardProps extends DealtCardsHook {
  dealOrderIndex: number;
}

export class Card extends React.Component<CardProps> {
  constructor(props: CardProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    const { dealtCards, dealOrderIndex, setDealtCards } = this.props;
    const newDealtCards = [...dealtCards];
    const newDealtCard = newDealtCards[dealOrderIndex]!;
    newDealtCard.kept = !newDealtCard.kept;
    setDealtCards(newDealtCards);
  }

  override render() {
    const { dealtCards, dealOrderIndex } = this.props;
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
