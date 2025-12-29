import { describe, expect, it } from "@jest/globals";
import { CARDS_PER_KEPT_HAND } from "../game/facts";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { expectedHandPoints } from "../game/expectedHandPoints";
import { handPoints } from "../game/handPoints";
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
      const expectedPoints = expectedHandPoints(keep, discard).total;
      const { container } = render(
        <ScoredPossibleKeepDiscard
          discard={discard}
          expectedHandPoints={expectedPoints}
          handPoints={points}
          keep={keep}
          sortOrder={sortOrder}
        />,
      );

      const keepString = handToSortedString(keep, sortOrder);
      const discardString = handToSortedString(discard, sortOrder);
      const fromCut = expectedPoints - points;

      const EXPECTED_POINTS_FRACTION_DIGITS = 2;

      // With the table structure, textContent will concatenate all cells directly.
      // e.g. "KeepStrDiscardStrPointsFromCutTotal"
      const pattern = new RegExp(
        `${keepString}${discardString}${points}${fromCut.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}${expectedPoints.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}`,
        "u",
      );

      expect(container.textContent).toMatch(pattern);
    },
  );
});
