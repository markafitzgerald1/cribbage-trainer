import { DealtCard } from "../DealtCard";
import React from "react";

export type CardProps = {
  dealOrderIndex: number;
  dealtCards: DealtCard[];
  setDealtCards: (dealtCards: DealtCard[]) => void;
};

export class Card extends React.Component<CardProps> {
  constructor(props: CardProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    const { dealtCards, dealOrderIndex, setDealtCards } = this.props;
    const newDealtCards = [...dealtCards];
    const newDealtCard = newDealtCards[dealOrderIndex] as DealtCard;
    newDealtCard.kept = !newDealtCard.kept;
    setDealtCards(newDealtCards);
  }

  override render() {
    const { dealtCards, dealOrderIndex } = this.props;
    const { kept, rankLabel } = dealtCards[dealOrderIndex] as DealtCard;
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
