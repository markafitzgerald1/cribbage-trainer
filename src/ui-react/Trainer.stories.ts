import { Trainer, analyticsConsentKey } from "./Trainer";
import { expect, fireEvent, within } from "@storybook/test";
import type { Meta } from "@storybook/react";
/* jscpd:ignore-start */
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { SortOrder } from "../ui/SortOrder";
import { createArgTypes } from "./stories.common";
/* jscpd:ignore-end */
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

export const DiscardShowsScoredPossibilities = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const checkboxes = within(canvasElement).getAllByRole("checkbox");

    await fireEvent.click(checkboxes[0]!);
    await fireEvent.click(checkboxes[1]!);

    await expect(canvasElement).toHaveTextContent("Post-Starter Points");
  },
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
