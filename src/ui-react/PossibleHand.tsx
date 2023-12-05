import * as classes from "./PossibleHand.module.css";
import { CardLabel } from "./CardLabel";
import { DealtCard } from "../game/DealtCard";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { sortCards } from "../ui/sortCards";

export interface PossibleHandProps {
  readonly dealtCards: readonly DealtCard[];
  readonly sortOrder: SortOrder;
}

export function PossibleHand({ dealtCards, sortOrder }: PossibleHandProps) {
  return (
    <span className={classes.keepDiscard}>
      {sortCards(dealtCards, sortOrder).map((dealtCard) => (
        <span
          className={`${classes.card}`}
          key={dealtCard.dealOrder}
        >
          <CardLabel rank={dealtCard.rank} />
        </span>
      ))}
    </span>
  );
}
