import { CARD_LABELS, createCard } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { PossibleHand } from "./PossibleHand";
import React from "react";
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

  it("render a span with class keep-discard", () =>
    expect(
      render(
        <PossibleHand
          dealtCards={[]}
          sortOrder={SortOrder.Ascending}
        />,
      ).container.querySelector("span.keep-discard"),
    ).toBeTruthy());

  const keptHand = "TAJ4";
  const discard = "5K";
  it.each([
    ["A4TJ", SortOrder[SortOrder.Ascending], keptHand],
    ["JT4A", SortOrder[SortOrder.Descending], keptHand],
    [keptHand, SortOrder[SortOrder.DealOrder], keptHand],
    [discard, SortOrder[SortOrder.Ascending], discard],
    ["K5", SortOrder[SortOrder.Descending], discard],
    [discard, SortOrder[SortOrder.DealOrder], discard],
  ])(
    "renders a span with class keep-discard and dealt cards %s sorted in %s order",
    (sortedHand, sortOrder, hand) =>
      expect(
        render(
          <PossibleHand
            dealtCards={hand.split("").map((rankLabel, dealOrder) => ({
              ...createCard(CARD_LABELS.indexOf(rankLabel)),
              dealOrder,
              kept: true,
            }))}
            sortOrder={SortOrder[sortOrder as keyof typeof SortOrder]}
          />,
        ).container.querySelector("span.keep-discard")!.textContent,
      ).toStrictEqual(sortedHand),
  );
});