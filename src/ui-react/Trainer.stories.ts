import { Trainer, analyticsConsentKey } from "./Trainer";
import { expect, fireEvent, within } from "@storybook/test";
/* jscpd:ignore-start */
import type { Meta } from "@storybook/react";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { createArgTypes } from "./stories.common";
/* jscpd:ignore-end */
import { createGenerator } from "../game/randomNumberGenerator";

const SEED = "1";

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  args: {
    generateRandomNumber: createGenerator(SEED),
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

const createAnalyticsSelectionMadeStory = (
  buttonNumber: number,
  expectedTextContent: string,
) => ({
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const buttons = within(canvasElement).getAllByRole("button");

    await fireEvent.click(buttons[buttonNumber]!);

    await expect(canvasElement).toHaveTextContent(expectedTextContent);
  },
});

export const AnalyticsAccepted = createAnalyticsSelectionMadeStory(
  0,
  "Thank you! Your consent helps us improve our site using tools like Google Analytics. For more details, please see our Privacy Policy (coming soon).",
);

export const AnalyticsDisabled = createAnalyticsSelectionMadeStory(
  1,
  "Analytics have been disabled. You can find more information in our Privacy Policy (coming soon).",
);

export const DiscardShowsScoredPossibilities = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const checkboxes = within(canvasElement).getAllByRole("checkbox");

    await fireEvent.click(checkboxes[0]!);
    await fireEvent.click(checkboxes[1]!);

    await expect(canvasElement).toHaveTextContent("Pre-cut hand");
  },
};

const createPlay =
  (radioButtonValue: string) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const radioButtons = within(canvasElement).getAllByRole("radio");
    const dealOrderRadioButton = radioButtons.find(
      (radioButton) => radioButton.getAttribute("value") === radioButtonValue,
    )!;
    const initialCanvasElementTextContent = canvasElement.textContent;

    await fireEvent.click(dealOrderRadioButton);

    await expect(canvasElement.textContent).not.toEqual(
      initialCanvasElementTextContent,
    );
  };

export const SortHandInDealOrder = {
  play: createPlay("DealOrder"),
};

export const SortHandInAscendingOrder = {
  play: createPlay("Ascending"),
};
