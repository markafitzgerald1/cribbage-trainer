/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import { CARD_LABELS, Rank, type Suit, parseHand } from "../game/Card";
import { type ComparableCard, sortCards } from "../ui/sortCards";
import {
  DEALER_RANDOM_VALUE,
  PONE_RANDOM_VALUE,
  SIX_HEARTS_HAND,
  calculationsHeaderName,
  clickDeal,
  clickIndices,
  createRoleRandomValues,
  createSequenceGenerator,
  expectDealerRoleVisible,
  expectPoneRoleVisible,
  renderTrainer,
  renderTrainerShowingDealerRole,
  renderTrainerWithGenerator,
  renderTrainerWithInitialProps,
} from "./Trainer.test.common";
import { describe, expect, it } from "@jest/globals";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { CribRole } from "../game/expectedCribPoints";
import { SortOrder } from "../ui/SortOrder";
import { analyticsConsentKey } from "./Trainer";
import { getSortOrderName } from "../ui/SortOrderName";
import { screen } from "@testing-library/react";
/* jscpd:ignore-end */

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
    `input[value='${getSortOrderName(sortOrder)}']`,
  )!;
}

const clearAnalyticsConsent = () =>
  localStorage.removeItem(analyticsConsentKey);

const setupTrainerUser = () => ({
  ...renderTrainer(),
  user: userEvent.setup(),
});

const openCardEntry = (user: UserEvent) =>
  user.click(screen.getByRole("button", { name: "Enter cards" }));

const renderTrainerWithInitialHand = () =>
  renderTrainerWithInitialProps({
    initialCards: parseHand(SIX_HEARTS_HAND),
    initialCribRole: CribRole.Dealer,
  });

describe("trainer component", () => {
  it("initially contains a sort in descending order radio input", () => {
    expect(renderTrainer().queryByLabelText("↓")).toBeTruthy();
  });

  it("contains a dealt hand", () => {
    expect(renderTrainer().queryByText("Hand")).toBeTruthy();
  });

  it("introduces the app with a title and purpose tagline", () => {
    renderTrainer();

    expect(
      screen.getByRole("heading", { level: 1, name: "Cribbage Trainer" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/expected-score analysis/u)).toBeInTheDocument();
  });

  it("shows the randomized dealer role", () => {
    renderTrainerShowingDealerRole();

    expectDealerRoleVisible();
  });

  it("randomizes the role on a new deal", async () => {
    const user = userEvent.setup();

    renderTrainerWithGenerator(
      createSequenceGenerator(
        createRoleRandomValues([DEALER_RANDOM_VALUE, PONE_RANDOM_VALUE]),
      ),
    );

    expectDealerRoleVisible();

    await clickDeal(user);

    expectPoneRoleVisible();
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
      const { container, user } = setupTrainerUser();
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

      expect(localStorage.getItem(analyticsConsentKey)).toBe(
        expectedConsent.toString(),
      );
    },
  );

  it("initially shows only Privacy Policy link when consent is in local storage", () => {
    localStorage.setItem(analyticsConsentKey, "true");
    const renderResult = renderTrainer();

    expect(renderResult.getByText("Privacy Policy")).toBeTruthy();
    expect(
      renderResult.queryByText(/^Thank you! Your consent helps/u),
    ).toBeFalsy();
  });

  it("requires a new choice after the analytics policy changes", () => {
    clearAnalyticsConsent();
    localStorage.setItem("analyticsConsent", "true");

    const renderResult = renderTrainer();

    expect(
      renderResult.getByRole("button", { name: "Accept" }),
    ).toBeInTheDocument();
    expect(
      renderResult.getByRole("button", { name: "Decline" }),
    ).toBeInTheDocument();
  });

  it("deals new cards after a 'Deal' button click", async () => {
    const { container, user } = setupTrainerUser();
    const dealButton = screen.getByRole("button", { name: "Deal" });
    const initialDealtHand = container.querySelector("ul")!.textContent;

    await user.click(dealButton);

    expect(container.querySelector("ul")!.textContent).not.toBe(
      initialDealtHand,
    );
  });

  it("closes manual entry without changing the hand", async () => {
    const { container, user } = setupTrainerUser();
    const initialHand = container.querySelector("ul")!.textContent;

    await openCardEntry(user);
    await user.click(screen.getByRole("button", { name: "Close modal" }));

    expect(
      screen.queryByRole("heading", { name: "Enter cards" }),
    ).not.toBeInTheDocument();
    expect(container.querySelector("ul")!.textContent).toBe(initialHand);
  });

  it("renders the specified initialCards", () => {
    const { container } = renderTrainerWithInitialHand();

    expect(container.querySelector("ul")!.textContent).toBe("6♥5♥4♥3♥2♥A♥");
  });

  it.each([CribRole.Dealer, CribRole.Pone])(
    "analyzes a manually entered hand as %s",
    async (cribRole) => {
      const user = userEvent.setup();
      renderTrainerWithInitialHand();

      await openCardEntry(user);
      await user.click(screen.getByRole("button", { name: "A♥" }));
      await user.click(screen.getByRole("button", { name: "7♣" }));
      await user.click(screen.getByRole("radio", { name: cribRole }));
      await user.click(screen.getByRole("button", { name: "Use hand" }));
      await clickIndices(
        (role, options) => screen.getAllByRole(role, options),
        [0, 1],
        user,
      );

      await expect(
        screen.findByRole("columnheader", {
          name: calculationsHeaderName,
        }),
      ).resolves.toBeInTheDocument();
      expect(new URLSearchParams(window.location.search).get("hand")).toBe(
        "2H,3H,4H,5H,6H,7C",
      );
      expect(new URLSearchParams(window.location.search).get("role")).toBe(
        cribRole.toLowerCase(),
      );
    },
  );

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
