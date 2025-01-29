import "@testing-library/jest-dom";
import {
  ByRoleMatcher,
  ByRoleOptions,
  render,
  screen,
} from "@testing-library/react";
import { ComparableCard, sortCards } from "../ui/sortCards";
import { describe, expect, it, jest } from "@jest/globals";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { CARD_LABELS } from "../game/Card";
import { SortOrder } from "../ui/SortOrder";
import { Trainer } from "./Trainer";
import { act } from "react";

describe("trainer component", () => {
  const mathRandom = Math.random;

  const renderTrainer = () =>
    render(
      <Trainer
        generateRandomNumber={mathRandom}
        loadGoogleAnalytics={jest.fn()}
      />,
    );

  const postStarterExpectedHandPoints = "Post-Starter Points";

  const clickIndices = (
    getAllByRole: (
      role: ByRoleMatcher,
      options?: ByRoleOptions,
    ) => HTMLElement[],
    indices: number[],
    user: UserEvent,
  ) =>
    Promise.all(
      indices.map((index) => user.click(getAllByRole("checkbox")[index]!)),
    );

  const expectCalculationsAfterClicks = async (
    cardIndices: number[],
    calculationsExpected: boolean,
  ) => {
    const user = userEvent.setup();
    const { getAllByRole, queryByText } = renderTrainer();

    await act(() => clickIndices(getAllByRole, cardIndices, user));

    expect(Boolean(queryByText(postStarterExpectedHandPoints))).toBe(
      calculationsExpected,
    );
  };

  it("initially contains a sort in descending order radio input", () => {
    expect(renderTrainer().queryByLabelText("↓")).toBeTruthy();
  });

  it("contains a dealt hand", () => {
    expect(renderTrainer().queryByText("Hand")).toBeTruthy();
  });

  it("contains pre-cut hand points possibilities once two cards have been selected", async () => {
    await expectCalculationsAfterClicks([0, 1], true);
  });

  it("hides pre-cut hand points possibilities once two cards have been selected and then one of them is unselected", async () => {
    await expectCalculationsAfterClicks([0, 1, 1], false);
  });

  it("hides pre-cut hand points possibilities if more than two cards are selected", async () => {
    const moreThanTwo = 3;
    await expectCalculationsAfterClicks([...Array(moreThanTwo).keys()], false);
  });

  const handTextToComparableCards = (
    initialDealtHand: string,
  ): ComparableCard[] => {
    const initialDealtHandRanks = initialDealtHand
      .replace(/10/gu, "T")
      .split("")
      .map((cardLabel) => (cardLabel === "T" ? "10" : cardLabel))
      .map((cardLabel, dealOrder) => ({
        dealOrder,
        rank: CARD_LABELS.indexOf(cardLabel),
      }));
    return initialDealtHandRanks;
  };

  it.each([SortOrder.Ascending, SortOrder.Descending])(
    "re-sorts the dealt hand when the sort order is changed to %s",
    async (newSortOrder) => {
      const { container } = renderTrainer();
      const user = userEvent.setup();
      const sortInDealOrderInput = container.querySelector(
        `input[value='${SortOrder[SortOrder.DealOrder]}']`,
      )!;
      await act(() => user.click(sortInDealOrderInput));
      const expectedSortedCards = sortCards(
        handTextToComparableCards(container.querySelector("ul")!.textContent!),
        newSortOrder,
      )
        .map((dealtCard) => CARD_LABELS[dealtCard.rank])
        .join("");
      const newSortInput = container.querySelector(
        `input[value='${SortOrder[newSortOrder]}']`,
      )!;

      await act(() => user.click(newSortInput));

      expect(container.querySelector("ul")!.textContent).toBe(
        expectedSortedCards,
      );
    },
  );

  const ANALYTICS_CONSENT = "analyticsConsent";

  const clearAnalyticsConsent = () =>
    localStorage.removeItem(ANALYTICS_CONSENT);

  it.each([
    [true, "Accept"],
    [false, "Decline"],
  ])(
    "persists that analytics acceptance is %s when button %d is clicked",
    async (expectedConsent, buttonText) => {
      clearAnalyticsConsent();
      const user = userEvent.setup();
      renderTrainer();

      const button = screen.getByRole("button", { name: buttonText });

      await act(() => user.click(button));

      expect(localStorage.getItem(ANALYTICS_CONSENT)).toBe(
        expectedConsent.toString(),
      );
    },
  );

  it("initially sets the analytics consent based on local storage", () => {
    localStorage.setItem(ANALYTICS_CONSENT, "true");
    const renderResult = renderTrainer();

    expect(
      renderResult.getByText(
        /^Thank you! Your consent helps us improve our site using tools like Google Analytics. /u,
      ),
    ).toBeInTheDocument();
  });

  it("deals new cards after a 'Deal' button click", async () => {
    const { container } = renderTrainer();
    const dealButton = screen.getByRole("button", { name: "Deal" });
    const user = userEvent.setup();
    const initialDealtHand = container.querySelector("ul")!.textContent;

    await act(() => user.click(dealButton));

    expect(container.querySelector("ul")!.textContent).not.toBe(
      initialDealtHand,
    );
  });
});
