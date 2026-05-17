import "@testing-library/jest-dom";
import {
  type ByRoleMatcher,
  type ByRoleOptions,
  render,
  screen,
} from "@testing-library/react";
import { CARD_LABELS, Rank, type Suit, parseHand } from "../game/Card";
import { type ComparableCard, sortCards } from "../ui/sortCards";
import { describe, expect, it, jest } from "@jest/globals";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { SortOrder } from "../ui/SortOrder";
import { Trainer } from "./Trainer";

const mathRandom = Math.random;

const renderTrainer = () =>
  render(
    <Trainer
      generateRandomNumber={mathRandom}
      loadGoogleAnalytics={jest.fn()}
    />,
  );

const calculationsHeaderName = "Hand";

const clickIndices = (
  getAllByRole: (role: ByRoleMatcher, options?: ByRoleOptions) => HTMLElement[],
  indices: number[],
  user: UserEvent,
) =>
  indices.reduce(
    (previousClick, index) =>
      previousClick.then(() => user.click(getAllByRole("checkbox")[index]!)),
    Promise.resolve(),
  );

const toggleCard = async (checkbox: HTMLElement, user: UserEvent) => {
  await user.click(checkbox);
};

const expectCalculationsAfterClicks = async (
  cardIndices: number[],
  calculationsExpected: boolean,
) => {
  const user = userEvent.setup();
  const { getAllByRole, queryByRole } = renderTrainer();

  await clickIndices(getAllByRole, cardIndices, user);

  expect(
    Boolean(queryByRole("columnheader", { name: calculationsHeaderName })),
  ).toBe(calculationsExpected);
};

const handTextToComparableCards = (
  initialDealtHand: string,
): ComparableCard[] => {
  const regex = /(?<rankLabel>10|[A2-9JQK])(?<suit>[♣♦♥♠])/gu;
  const matches = Array.from(initialDealtHand.matchAll(regex));

  return matches.map((match, index) => {
    const { rankLabel, suit } = match.groups!;

    return {
      dealOrder: index,
      rank: CARD_LABELS.indexOf(rankLabel!) as Rank,
      suit: suit as Suit,
    };
  });
};

function getSortInput(container: HTMLElement, sortOrder: SortOrder) {
  return container.querySelector(
    `input[value='${Object.keys(SortOrder).find((key) => SortOrder[key as keyof typeof SortOrder] === sortOrder)}']`,
  )!;
}

const ANALYTICS_CONSENT = "analyticsConsent";

const clearAnalyticsConsent = () => localStorage.removeItem(ANALYTICS_CONSENT);

describe("trainer component", () => {
  it("initially contains a sort in descending order radio input", () => {
    expect(renderTrainer().queryByLabelText("↓")).toBeTruthy();
  });

  it("contains a dealt hand", () => {
    expect(renderTrainer().queryByText("Hand")).toBeTruthy();
  });

  it("contains hand points once two cards have been selected", async () => {
    await expectCalculationsAfterClicks([0, 1], true);
  });

  it("hides hand points once two cards have been selected and then one of them is unselected", async () => {
    await expectCalculationsAfterClicks([0, 1, 1], false);
  });

  it("hides hand points if more than two cards are selected", async () => {
    const moreThanTwo = 3;
    await expectCalculationsAfterClicks([...Array(moreThanTwo).keys()], false);
  });

  it.each([SortOrder.Ascending, SortOrder.Descending])(
    "re-sorts the dealt hand when the sort order is changed to %s",
    async (newSortOrder) => {
      const { container } = renderTrainer();
      const user = userEvent.setup();
      const sortInDealOrderInput = getSortInput(container, SortOrder.DealOrder);
      await user.click(sortInDealOrderInput);
      const expectedSortedCards = sortCards(
        handTextToComparableCards(container.querySelector("ul")!.textContent),
        newSortOrder,
      )
        .map((dealtCard) => `${CARD_LABELS[dealtCard.rank]}${dealtCard.suit}`)
        .join("");
      const newSortInput = getSortInput(container, newSortOrder);

      await user.click(newSortInput);

      expect(container.querySelector("ul")!.textContent).toBe(
        expectedSortedCards,
      );
    },
  );

  it.each([
    [true, "Accept"],
    [false, "Decline"],
  ])(
    "persists that analytics acceptance is %s when button %s is clicked",
    async (expectedConsent, buttonText) => {
      clearAnalyticsConsent();
      const user = userEvent.setup();
      renderTrainer();

      const button = screen.getByRole("button", { name: buttonText });

      await user.click(button);

      expect(localStorage.getItem(ANALYTICS_CONSENT)).toBe(
        expectedConsent.toString(),
      );
    },
  );

  it("initially shows only Privacy Policy link when consent is in local storage", () => {
    localStorage.setItem(ANALYTICS_CONSENT, "true");
    const renderResult = renderTrainer();

    expect(renderResult.getByText("Privacy Policy")).toBeTruthy();
    expect(
      renderResult.queryByText(/^Thank you! Your consent helps/u),
    ).toBeFalsy();
  });

  it("deals new cards after a 'Deal' button click", async () => {
    const { container } = renderTrainer();
    const dealButton = screen.getByRole("button", { name: "Deal" });
    const user = userEvent.setup();
    const initialDealtHand = container.querySelector("ul")!.textContent;

    await user.click(dealButton);

    expect(container.querySelector("ul")!.textContent).not.toBe(
      initialDealtHand,
    );
  });

  it("renders the specified initialCards", () => {
    const initialCards = parseHand("AH,2H,3H,4H,5H,6H");
    const { container } = render(
      <Trainer
        generateRandomNumber={mathRandom}
        initialCards={initialCards}
        loadGoogleAnalytics={jest.fn()}
      />,
    );

    expect(container.querySelector("ul")!.textContent).toBe("6♥5♥4♥3♥2♥A♥");
  });

  it("toggles card selection", async () => {
    const user = userEvent.setup();
    const { getAllByRole } = renderTrainer();
    const firstCheckbox = getAllByRole("checkbox")[0]!;

    expect(firstCheckbox).toBeChecked();

    await toggleCard(firstCheckbox, user);

    expect(firstCheckbox).not.toBeChecked();

    await toggleCard(firstCheckbox, user);

    expect(firstCheckbox).toBeChecked();
  });
});
