import * as classes from "./Hand.module.css";
import { Card } from "./Card";
import { HandProps } from "./HandProps";
import React from "react";
import { sortCards } from "../ui/sortCards";

export class Hand extends React.Component<HandProps> {
  handleCheckboxChange = (dealOrderIndex: number) => {
    const { dealtCards, setDealtCards } = this.props;
    const newDealtCards = [...dealtCards];
    // eslint-disable-next-line security/detect-object-injection
    const newDealtCard = newDealtCards[dealOrderIndex]!;
    newDealtCard.kept = !newDealtCard.kept;
    setDealtCards(newDealtCards);
  };

  override render() {
    const { dealtCards, sortOrder } = this.props;
    const sortedDealtCards = sortCards(dealtCards, sortOrder);
    return (
      <figure className={classes.figure}>
        <figcaption className={classes.figcaption}>Dealt hand:</figcaption>
        <ul className={classes.hand}>
          {sortedDealtCards.map((dealtCard) => (
            <Card
              dealOrderIndex={dealtCard.dealOrder}
              kept={dealtCard.kept}
              key={dealtCard.dealOrder}
              onChange={this.handleCheckboxChange}
              rankLabel={dealtCard.rankLabel}
            />
          ))}
        </ul>
      </figure>
    );
  }
}
