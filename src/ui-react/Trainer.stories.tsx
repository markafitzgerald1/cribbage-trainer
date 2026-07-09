import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  createArgTypes,
  playToggle,
} from "./stories.common";
import { Rank, Suit, createCard } from "../game/Card";
import { Trainer, analyticsConsentKey } from "./Trainer";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import { CribRole } from "../game/expectedCribPoints";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
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

const expectColumnHeaders = async (
  canvasElement: HTMLElement,
  columnHeaders: readonly string[],
) => {
  await waitFor(
    async () => {
      await expect(
        within(canvasElement).queryByText("Loading analysis..."),
      ).toBeNull();
    },
    { timeout: 5000 },
  );

  await Promise.all(
    columnHeaders.map(
      async (columnHeader) =>
        await expect(
          within(canvasElement).getByRole("columnheader", {
            name: columnHeader,
          }),
        ).toBeVisible(),
    ),
  );
};

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

const expectAnalysisColumnHeaders = (canvasElement: HTMLElement) =>
  expectColumnHeaders(canvasElement, ["Hand", "Crib", "Play", "Net"]);

export const DiscardShowsScoredPossibilities = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const checkboxes = within(canvasElement).getAllByRole("checkbox");

    await fireEvent.click(checkboxes[0]!);
    await fireEvent.click(checkboxes[1]!);

    await expectAnalysisColumnHeaders(canvasElement);
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

const SIX_OF_SPADES = createCard(Rank.SIX, Suit.SPADES);
const FIVE_OF_HEARTS = createCard(Rank.FIVE, Suit.HEARTS);

export const DeepLinkedAnalysisState = {
  args: {
    initialCards: [
      createCard(Rank.KING, Suit.HEARTS),
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.TEN, Suit.DIAMONDS),
      createCard(Rank.NINE, Suit.CLUBS),
      SIX_OF_SPADES,
      FIVE_OF_HEARTS,
    ],
    initialCribRole: CribRole.Pone,
    initialDiscards: [SIX_OF_SPADES, FIVE_OF_HEARTS],
    initialScoreSortKey: ScoredKeepDiscardSortKey.ExpectedHandPoints,
    initialSortOrder: SortOrder.DealOrder,
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await expect(within(canvasElement).getByText("Pone")).toBeVisible();

    await expectAnalysisColumnHeaders(canvasElement);

    const handHeader = within(canvasElement).getByRole("columnheader", {
      name: /Hand/u,
    });

    await expect(handHeader).toHaveAttribute("aria-sort", "descending");
  },
};

export const SortAnalysisByPlayPoints = {
  play: async (context: { canvasElement: HTMLElement }) => {
    await DiscardShowsScoredPossibilities.play(context);
    const playHeaderButton = within(context.canvasElement).getByRole("button", {
      name: /^Play:/u,
    });

    await fireEvent.click(playHeaderButton);

    const playHeader = within(context.canvasElement).getByRole("columnheader", {
      name: /Play/u,
    });

    await expect(playHeader).toHaveAttribute("aria-sort", "descending");
  },
};

export const WithInitialCards = {
  args: {
    initialCards: [
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.TWO, Suit.HEARTS),
      createCard(Rank.THREE, Suit.DIAMONDS),
      createCard(Rank.FOUR, Suit.CLUBS),
      createCard(Rank.FIVE, Suit.SPADES),
      createCard(Rank.SIX, Suit.HEARTS),
    ],
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const handCardLabels = within(canvasElement)
      .getAllByRole("checkbox")
      .map((checkbox) => checkbox.closest("label")?.textContent);

    await expect(handCardLabels).toEqual(["6♥", "5♠", "4♣", "3♦", "2♥", "A♠"]);
  },
};

const createManualEntryPlay =
  (replacement?: readonly [string, string]) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await fireEvent.click(getButton(canvasElement, "Enter cards"));
    if (replacement) {
      await fireEvent.click(
        canvas.getByRole("button", {
          name: replacement[0],
          pressed: true,
        }),
      );
      await fireEvent.click(
        canvas.getByRole("button", { name: replacement[1] }),
      );
    }
    await fireEvent.click(getButton(canvasElement, "Analyze"));

    await expect(
      canvas.queryByRole("heading", { name: "Enter cards" }),
    ).not.toBeInTheDocument();
  };

export const UnchangedManualEntryCloses = {
  args: WithInitialCards.args,
  play: createManualEntryPlay(),
};

export const ChangedManualEntryApplies = {
  args: WithInitialCards.args,
  play: createManualEntryPlay(["A♠", "A♣"]),
};
