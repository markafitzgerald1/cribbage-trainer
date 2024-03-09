import { CARD_LABELS, createCard } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { PossibleHand } from "./PossibleHand";
import { SortOrder } from "../ui/SortOrder";
import { render } from "@testing-library/react";

describe("possible hand component", () => {
  it("renders a span", () => {
    expect(
      render(
        <PossibleHand
          dealtCards={[]}
          sortOrder={SortOrder.Ascending}
        />,
      ).container.querySelector("span"),
    ).toBeTruthy();
  });

  const keptHand = "10,A,J,4";
  const discard = "5,K";
  it.each([
    ["A410J", SortOrder[SortOrder.Ascending], keptHand],
    ["J104A", SortOrder[SortOrder.Descending], keptHand],
    [keptHand, SortOrder[SortOrder.DealOrder], keptHand],
    [discard, SortOrder[SortOrder.Ascending], discard],
    ["K5", SortOrder[SortOrder.Descending], discard],
    [discard, SortOrder[SortOrder.DealOrder], discard],
  ])(
    "renders a span with dealt cards %s sorted in %s order",
    (sortedHand, sortOrder, hand) =>
      expect(
        render(
          <PossibleHand
            dealtCards={hand.split(",").map((rankLabel, dealOrder) => ({
              ...createCard(CARD_LABELS.indexOf(rankLabel)),
              dealOrder,
              kept: true,
            }))}
            sortOrder={SortOrder[sortOrder as keyof typeof SortOrder]}
          />,
        ).container.querySelector("span")!.textContent,
      ).toStrictEqual(sortedHand.replace(/,/gu, "")),
  );
});
