import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  createArgTypes,
  playToggle,
} from "./stories.common";
import { Trainer, analyticsConsentKey } from "./Trainer";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import { Suit } from "../game/Card";
import { createGenerator } from "../game/randomNumberGenerator";

const SEED = "1";

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  args: {
    generateRandomNumber: createGenerator(SEED),
    loadGoogleAnalytics: () => null,
  },
  beforeEach: () => () => {
    localStorage.removeItem(analyticsConsentKey);
  },
  component: Trainer,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  title: "Trainer",
} satisfies Meta<typeof Trainer>;

export default meta;

const getButton = (canvasElement: HTMLElement, buttonText: string) =>
  within(canvasElement).getByRole("button", { name: buttonText });

export const AnalyticsAccepted = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const acceptButton = getButton(canvasElement, "Accept");

    await fireEvent.click(acceptButton);

    await expect(canvasElement).toHaveTextContent(
      "Thank you! Your consent helps us improve our site using tools like Google Analytics. For more details, please see our Privacy Policy.",
    );
  },
};

export const AnalyticsDisabled = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const declineButton = getButton(canvasElement, "Decline");

    await fireEvent.click(declineButton);

    await expect(canvasElement).toHaveTextContent(
      "Analytics have been disabled. You can find more information in our Privacy Policy.",
    );
  },
};

export const StoredConsentGiven = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // When consent is already stored, only the Privacy Policy link is shown (no Thank You message)
    // Wait for fade-in animation to complete before checking visibility
    await waitFor(
      async () => {
        await expect(
          within(canvasElement).getByText("Privacy Policy"),
        ).toBeVisible();
      },
      { timeout: 1000 },
    );

    await expect(
      within(canvasElement).queryByText("Thank you!"),
    ).not.toBeInTheDocument();
  },
  render: ({
    generateRandomNumber,
    loadGoogleAnalytics,
  }: Parameters<typeof Trainer>[0]) => {
    localStorage.setItem(analyticsConsentKey, "true");

    return (
      <Trainer
        generateRandomNumber={generateRandomNumber}
        loadGoogleAnalytics={loadGoogleAnalytics}
      />
    );
  },
};

export const DealNewHandReplacesCards = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const dealButton = getButton(canvasElement, "Deal");
    const initialHandText = canvasElement.textContent;

    await fireEvent.click(dealButton);

    await expect(canvasElement.textContent).not.toEqual(initialHandText);
  },
};

export const DiscardShowsScoredPossibilities = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const checkboxes = within(canvasElement).getAllByRole("checkbox");

    await fireEvent.click(checkboxes[0]!);
    await fireEvent.click(checkboxes[1]!);

    await expect(
      within(canvasElement).getByRole("columnheader", { name: "Hand" }),
    ).toBeVisible();
    await expect(
      within(canvasElement).getByRole("columnheader", { name: "Cut" }),
    ).toBeVisible();
  },
};

const playTrainerToggle =
  (toggleStarterDetails = false) =>
  async (context: { canvasElement: HTMLElement }) => {
    await DiscardShowsScoredPossibilities.play(context);
    await playToggle(context, { toggleStarterDetails });
  };

export const Expanded = {
  ...DiscardShowsScoredPossibilities,
  play: playTrainerToggle(),
};

export const DoubleExpanded = {
  ...DiscardShowsScoredPossibilities,
  play: playTrainerToggle(true),
};

const createPlay =
  (radioButtonValue: SortOrder) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const radioButtons = within(canvasElement).getAllByRole("radio");
    const dealOrderRadioButton = radioButtons.find(
      (radioButton) =>
        radioButton.getAttribute("value") ===
        Object.keys(SortOrder).find(
          (key) =>
            SortOrder[key as keyof typeof SortOrder] === radioButtonValue,
        ),
    )!;
    const initialCanvasElementTextContent = canvasElement.textContent;

    await fireEvent.click(dealOrderRadioButton);

    await expect(canvasElement.textContent).not.toEqual(
      initialCanvasElementTextContent,
    );
  };

export const SortHandInDealOrder = {
  play: createPlay(SortOrder.DealOrder),
};

export const SortHandInAscendingOrder = {
  play: createPlay(SortOrder.Ascending),
};

export const WithInitialCards = {
  args: {
    initialCards: [
      { count: 1, rank: 0, rankLabel: "A", suit: Suit.SPADES },
      { count: 2, rank: 1, rankLabel: "2", suit: Suit.HEARTS },
      { count: 3, rank: 2, rankLabel: "3", suit: Suit.DIAMONDS },
      { count: 4, rank: 3, rankLabel: "4", suit: Suit.CLUBS },
      { count: 5, rank: 4, rankLabel: "5", suit: Suit.SPADES },
      { count: 6, rank: 5, rankLabel: "6", suit: Suit.HEARTS },
    ],
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await expect(canvasElement).toHaveTextContent("A");
    await expect(canvasElement).toHaveTextContent("2");
  },
};
