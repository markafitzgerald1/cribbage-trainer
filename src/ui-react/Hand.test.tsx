/* jscpd:ignore-start */
import { describe, expect, it, jest } from "@jest/globals";
import { Hand } from "./Hand";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { SortOrder } from "../ui/SortOrder";
import { dealHand } from "../game/dealHand";
import { queryAllByCardText } from "./test-utils";
import { render } from "@testing-library/react";
import { sortCards } from "../ui/sortCards";
/* jscpd:ignore-end */

describe("hand component", () => {
  const renderCards = (
    dealtCards: ReturnType<typeof dealHand>,
    sortOrder: SortOrder,
  ) =>
    render(
      <Hand
        dealtCards={dealtCards}
        onChange={jest.fn()}
        sortOrder={sortOrder}
      />,
    );

  const dealAndRender = (sortOrder: SortOrder) => {
    const dealtHand = dealHand(Math.random);
    const view = renderCards(dealtHand, sortOrder);

    return {
      dealtHand,
      getAllByRole: view.getAllByRole,
      queryAllByText: view.queryAllByText,
      queryByRole: view.queryByRole,
      queryByText: view.queryByText,
    };
  };

  const caption = "Hand";

  it(`has an accessible caption '${caption}'`, () => {
    const captionElement = dealAndRender(SortOrder.Ascending).queryByText(
      caption,
    );

    expect(captionElement).toBeTruthy();
    expect(captionElement?.tagName).toBe("FIGCAPTION");
  });

  it("renders the on-screen discard cue", () => {
    const cueElement = dealAndRender(SortOrder.Ascending).queryByText(
      "Select two cards to discard",
    );

    expect(cueElement).toBeTruthy();
    expect(cueElement?.tagName).toBe("P");
  });

  it("has a checkbox for each dealt card", () => {
    const { dealtHand, getAllByRole } = dealAndRender(SortOrder.Ascending);

    expect(getAllByRole("checkbox")).toHaveLength(dealtHand.length);
  });

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it.each(SORT_ORDER_NAMES)(
    "has the rank of each dealt card in %s order",
    (sortOrderName) => {
      const sortOrder = SortOrder[sortOrderName];
      const { dealtHand, queryAllByText } = dealAndRender(sortOrder);
      const sortedDealtHand = sortCards(dealtHand, sortOrder);

      const cardLabels = sortedDealtHand.map(
        (card) => `${card.rankLabel}${card.suit}`,
      );

      cardLabels.forEach((label) => {
        expect(queryAllByCardText({ queryAllByText }, label)).not.toHaveLength(
          0,
        );
      });
    },
  );

  it("replaces card DOM nodes when a new hand is dealt", () => {
    const handA = dealHand(() => 0.1);
    const view = renderCards(handA, SortOrder.DealOrder);
    const [firstCheckboxA] = view.getAllByRole("checkbox");

    view.rerender(
      <Hand
        dealtCards={dealHand(() => 0.9)}
        onChange={jest.fn()}
        sortOrder={SortOrder.Ascending}
      />,
    );

    const [firstCheckboxB] = view.getAllByRole("checkbox");

    expect(firstCheckboxB).not.toBe(firstCheckboxA);
  });

  it("preserves card DOM nodes when discard selection changes within the same hand", () => {
    const initialCards = dealHand(() => 0.2);
    const view = renderCards(initialCards, SortOrder.Descending);
    const [firstCheckbox] = view.getAllByRole("checkbox");

    initialCards[0]!.kept = false;

    view.rerender(
      <Hand
        dealtCards={[...initialCards]}
        onChange={jest.fn()}
        sortOrder={SortOrder.Descending}
      />,
    );

    const [updatedFirstCheckbox] = view.getAllByRole("checkbox");

    expect(updatedFirstCheckbox).toBe(firstCheckbox);
  });
});
