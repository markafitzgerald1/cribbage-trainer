/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { describe, expect, it } from "@jest/globals";
import { SortOrder } from "../ui/SortOrder";
import { SortedCardLabels } from "./SortedCardLabels";
import { parseHand } from "../game/Card";
import { render } from "@testing-library/react";
/* jscpd:ignore-end */

describe("sorted card labels", () => {
  const cards = parseHand("5H,KS,AC");

  it.each([
    {
      expected: "K♠5♥A♣",
      name: "descending",
      sortOrder: SortOrder.Descending,
    },
    {
      expected: "A♣5♥K♠",
      name: "ascending",
      sortOrder: SortOrder.Ascending,
    },
    {
      expected: "5♥K♠A♣",
      name: "deal order",
      sortOrder: SortOrder.DealOrder,
    },
  ])("renders cards in $name order", ({ expected, sortOrder }) => {
    const { container } = render(
      <SortedCardLabels
        cards={cards}
        sortOrder={sortOrder}
      />,
    );

    expect(container).toHaveTextContent(expected);
  });
});
