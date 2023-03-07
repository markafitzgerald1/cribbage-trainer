import { DealtCard } from "../DealtCard";
import React from "react";

export type CardProps = {
  dealtCard: DealtCard;
  dealOrderIndex: number;
  toggleKept: (index: number) => void;
};

export class Card extends React.Component<CardProps> {
  constructor(props: CardProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  override shouldComponentUpdate(nextProps: CardProps) {
    const {
      dealOrderIndex,
      dealtCard: { index, kept },
    } = this.props;
    return (
      dealOrderIndex !== nextProps.dealOrderIndex ||
      index !== nextProps.dealtCard.index ||
      kept !== nextProps.dealtCard.kept
    );
  }

  handleClick() {
    const { dealOrderIndex, toggleKept } = this.props;
    toggleKept(dealOrderIndex);
  }

  override render() {
    const {
      dealtCard: { kept, rankLabel },
    } = this.props;
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
