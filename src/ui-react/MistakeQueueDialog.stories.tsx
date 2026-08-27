/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { MistakeQueueDialog } from "./MistakeQueueDialog";
import dialogFixtures from "./MistakeQueueDialog.test.common";

const sampleTally = dialogFixtures.createSampleMistakeTally();
const allMasteredTally = dialogFixtures.createAllMasteredTally();
const emptyMistakeTally = dialogFixtures.createEmptyMistakeTally();

const meta = {
  args: {
    initialQuantileFilter: "all",
    initialRoleFilter: "all",
    initialSortOrder: "priority",
    initialStatusFilter: "active",
    onClose: fn(),
    show: true,
    tally: sampleTally,
  },
  component: MistakeQueueDialog,
  tags: ["autodocs"],
  title: "MistakeQueueDialog",
} satisfies Meta<typeof MistakeQueueDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const selectOption = async (
  canvasElement: HTMLElement,
  optionName: RegExp | string,
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
    await expectVisible(canvasElement, "Mistake queue");

    await selectOption(canvasElement, "Highest loss");
  },
};

export const FilterByRole: Story = {
  play: async ({ canvasElement }) => {
    await selectOption(canvasElement, "Dealer");
  },
};

export const FilterByStatus: Story = {
  play: async ({ canvasElement }) => {
    await selectOption(canvasElement, "Mastered");
  },
};

export const FilterByQuantile: Story = {
  args: {
    initialStatusFilter: "all",
  },
  play: async ({ canvasElement }) => {
    await selectOption(canvasElement, /^High \(/u);
  },
};

export const AllMasteredEmptyState: Story = {
  args: {
    tally: allMasteredTally,
  },
  play: async ({ canvasElement }) => {
    await expectVisible(canvasElement, "All mistake hands mastered!");
  },
};

export const EmptyQueueNotice: Story = {
  args: {
    tally: emptyMistakeTally,
  },
  play: async ({ canvasElement }) => {
    await expectVisible(canvasElement, /No mistake hands recorded yet/iu);
  },
};

export const DismissWithEscape: Story = {
  play: async ({ args }) => {
    await userEvent.keyboard("{Escape}");

    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};
/* jscpd:ignore-end */
