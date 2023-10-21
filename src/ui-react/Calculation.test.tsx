import { describe, expect, it } from "@jest/globals";
import { CARDS_PER_KEPT_HAND } from "../game/facts";
import { Calculation } from "./Calculation";
import { HandCard } from "../game/HandCard";
/* jscpd:ignore-start */
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
/* jscpd:ignore-end */
import { handPoints } from "../game/scoring";
import { render } from "@testing-library/react";
import { sortCards } from "../ui/sortCards";
import { sortOrderNames } from "../ui/SortOrderName";

const handToSortedString = (
  handCards: readonly HandCard[],
  sortOrder: SortOrder,
): string =>
  sortCards(handCards, sortOrder)
    .map((dealtCard) => dealtCard.rankLabel)
    .join("");

describe("calculation component", () => {
  it.each(sortOrderNames)(
    "should render %s ordered keep then discard then the points",
    (sortOrderName) => {
      const sortOrder = SortOrder[sortOrderName];
      const dealtHand = dealHand(Math.random);
      const keep = dealtHand.slice(0, CARDS_PER_KEPT_HAND);
      const discard = dealtHand.slice(CARDS_PER_KEPT_HAND);
      const points = handPoints(keep).total;
      const { container } = render(
        <Calculation
          discard={discard}
          keep={keep}
          points={points}
          sortOrder={sortOrder}
        />,
      );

      const keepString = handToSortedString(keep, sortOrder);
      const discardString = handToSortedString(discard, sortOrder);

      const pattern = new RegExp(
        `${keepString}.*\\(${discardString}\\).*\\s${points}\\spoints`,
        "u",
      );

      expect(container.textContent).toMatch(pattern);
    },
  );
});
