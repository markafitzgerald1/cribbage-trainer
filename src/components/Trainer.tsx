import { CARDS_PER_DISCARD } from "../cribbage";
import { Calculations } from "./Calculations";
import { DealtCard } from "../DealtCard";
import { Hand } from "./Hand";
import React from "react";
import ReactDOMClient from "react-dom/client";
import { Sort } from "../Sort";
import { SortName } from "../SortName";
import { SortOrder } from "./SortOrder";

const CARD_LABELS = "A23456789TJQK";
const MAXIMUM_CARD_COUNTING_VALUE = 10;
const CARDS_PER_DEALT_HAND = 6;
const INDICES_PER_SUIT = 13;

class Trainer extends React.Component<
  Record<string, never>,
  {
    dealtCards: DealtCard[];
    sortOrder: Sort;
    showCalculations: boolean;
  }
> {
  static descendingCompareFn(first: DealtCard, second: DealtCard) {
    return second.rankValue - first.rankValue;
  }

  constructor(props: Record<string, never>) {
    super(props);
    this.state = {
      dealtCards: Array.from({ length: CARDS_PER_DEALT_HAND }, () =>
        Math.floor(Math.random() * INDICES_PER_SUIT)
      )
        .map((rankValue, dealOrder) => ({
          count: Math.min(rankValue + 1, MAXIMUM_CARD_COUNTING_VALUE),
          dealOrder,
          kept: true,
          rankLabel: CARD_LABELS[rankValue] as string,
          rankValue,
        }))
        .sort(Trainer.descendingCompareFn),
      showCalculations: false,
      sortOrder: Sort.Descending,
    };
  }

  toggleKept = (index: number) => {
    const { dealtCards } = this.state;
    if (!Number.isInteger(index) || index < 0 || index >= dealtCards.length) {
      throw Error(`Invalid dealtCards ${dealtCards} index ${index}.`);
    }

    this.setState((state) => {
      const toggleCard = state.dealtCards[index] as DealtCard;
      toggleCard.kept = !toggleCard.kept;
      return {
        dealtCards: state.dealtCards,
        showCalculations:
          state.dealtCards.filter((dealtCard) => !dealtCard.kept).length ===
          CARDS_PER_DISCARD,
      };
    });
  };

  setSortOrder = (sortOrder: SortName) => {
    this.setState((state) => {
      switch (Sort[sortOrder]) {
        case Sort.Ascending:
          state.dealtCards.sort(
            (first, second) => first.rankValue - second.rankValue
          );
          break;
        case Sort.Descending:
          state.dealtCards.sort(Trainer.descendingCompareFn);
          break;
        default:
          state.dealtCards.sort(
            (first, second) => first.dealOrder - second.dealOrder
          );
          break;
      }
      return {
        dealtCards: state.dealtCards,
        sortOrder: Sort[sortOrder],
      };
    });
  };

  override render() {
    const { sortOrder, dealtCards, showCalculations } = this.state;
    return (
      <React.StrictMode>
        <div>
          <SortOrder
            setSortOrder={this.setSortOrder}
            sortOrder={sortOrder}
          />
          <Hand
            dealtCards={dealtCards}
            toggleKept={this.toggleKept}
          />
          {!showCalculations || <Calculations dealtCards={dealtCards} />}
        </div>
      </React.StrictMode>
    );
  }
}

ReactDOMClient.createRoot(
  document.querySelector("#trainer") ?? document.documentElement
).render(<Trainer />);
