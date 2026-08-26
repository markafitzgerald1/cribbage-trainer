import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { DecisionQualityTrendDialog } from "./DecisionQualityTrendDialog";
import dialogFixtures from "./DecisionQualityTrendDialog.test.common";

const sampleTally = dialogFixtures.dialogTally(30);
const cappedTally = dialogFixtures.cappedDialogTally();

const meta = {
  args: {
    initialGranularity: "rolling20",
    initialRoleFilter: "all",
    onClose: fn(),
    show: true,
    tally: sampleTally,
  },
  component: DecisionQualityTrendDialog,
  tags: ["autodocs"],
  title: "DecisionQualityTrendDialog",
} satisfies Meta<typeof DecisionQualityTrendDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const selectOption = async (
  canvasElement: HTMLElement,
  optionName: "Day" | "Dealer",
): Promise<void> => {
  const option = within(canvasElement).getByRole("radio", {
    name: optionName,
  });

  await userEvent.click(option);

  await expect(option).toBeChecked();
};

const expectVisible = async (
  canvasElement: HTMLElement,
  text: RegExp | string,
): Promise<void> => {
  await expect(within(canvasElement).getByText(text)).toBeVisible();
};

export const DefaultOpen: Story = {
  play: async ({ canvasElement }) => {
    await expectVisible(canvasElement, "Decision quality over time");

    await selectOption(canvasElement, "Day");
  },
};

export const FilterByRole: Story = {
  play: async ({ canvasElement }) => {
    await selectOption(canvasElement, "Dealer");
  },
};

export const AtRecordCap: Story = {
  args: {
    tally: cappedTally,
  },
  play: async ({ canvasElement }) => {
    await expectVisible(canvasElement, /retain up to 10,000 entries/iu);
  },
};

export const DismissWithEscape: Story = {
  play: async ({ args }) => {
    await userEvent.keyboard("{Escape}");

    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};
