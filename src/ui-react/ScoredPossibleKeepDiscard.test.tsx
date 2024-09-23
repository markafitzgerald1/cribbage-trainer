import { describe, expect, it } from "@jest/globals";
import { CARDS_PER_KEPT_HAND } from "../game/facts";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { handPoints } from "../game/scoring";
import { handToSortedString } from "./handToSortedString.test.common";
import { render } from "@testing-library/react";

describe("calculation component", () => {
  it.each(SORT_ORDER_NAMES)(
    "should render %s ordered keep then discard then the points",
    (sortOrderName) => {
      const sortOrder = SortOrder[sortOrderName];
      const dealtHand = dealHand(Math.random);
      const keep = dealtHand.slice(0, CARDS_PER_KEPT_HAND);
      const discard = dealtHand.slice(CARDS_PER_KEPT_HAND);
      const points = handPoints(keep).total;
      const { container } = render(
        <ScoredPossibleKeepDiscard
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
