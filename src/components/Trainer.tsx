import React, { useState } from "react";
import { CARDS_PER_DISCARD } from "../cribbage";
import { Calculations } from "./Calculations";
import { DealtCard } from "../DealtCard";
import { Hand } from "./Hand";
import ReactDOMClient from "react-dom/client";
import { Sort } from "../Sort";
import { SortOrder } from "./SortOrder";

const CARD_LABELS = "A23456789TJQK";
const MAXIMUM_CARD_COUNTING_VALUE = 10;
const CARDS_PER_DEALT_HAND = 6;
const INDICES_PER_SUIT = 13;

function Trainer() {
  const [sortOrder, setSortOrder] = useState(Sort.Descending);
  const [dealtCards, setDealtCards] = useState(
    Array.from({ length: CARDS_PER_DEALT_HAND }, () =>
      Math.floor(Math.random() * INDICES_PER_SUIT)
    )
      .map((rankValue, dealOrder) => ({
        count: Math.min(rankValue + 1, MAXIMUM_CARD_COUNTING_VALUE),
        dealOrder,
        kept: true,
        rankLabel: CARD_LABELS[rankValue] as string,
        rankValue,
      }))
      .sort(
        (first: DealtCard, second: DealtCard) =>
          second.rankValue - first.rankValue
      )
  );

  return (
    <React.StrictMode>
      <div>
        <SortOrder
          dealtCards={dealtCards}
          setDealtCards={setDealtCards}
          setSortOrder={setSortOrder}
          sortOrder={sortOrder}
        />
        <Hand
          dealtCards={dealtCards}
          setDealtCards={setDealtCards}
        />
        {!(
          dealtCards.filter((dealtCard) => dealtCard.kept).length ===
          CARDS_PER_DEALT_HAND - CARDS_PER_DISCARD
        ) || <Calculations dealtCards={dealtCards} />}
      </div>
    </React.StrictMode>
  );
}

ReactDOMClient.createRoot(
  document.querySelector("#trainer") ?? document.documentElement
).render(<Trainer />);
