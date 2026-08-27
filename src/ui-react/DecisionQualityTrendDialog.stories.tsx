import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  expectStoryTextVisible,
  playStoryEscape,
  selectStoryRadioOption,
} from "./stories.common";
import { DecisionQualityTrendDialog } from "./DecisionQualityTrendDialog";
import dialogFixtures from "./DecisionQualityTrendDialog.test.common";
import { fn } from "storybook/test";

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

export const DefaultOpen: Story = {
  play: async ({ canvasElement }) => {
    await selectStoryRadioOption(canvasElement, "Day");
    await expectStoryTextVisible(canvasElement, "Period / Batch");
  },
};

export const DealerFilter: Story = {
  args: {
    initialRoleFilter: "dealer",
  },
};

export const PoneFilter: Story = {
  args: {
    initialRoleFilter: "pone",
  },
};

export const AtRecordCap: Story = {
  args: {
    tally: cappedTally,
  },
  play: async ({ canvasElement }) => {
    await expectStoryTextVisible(
      canvasElement,
      /retain up to 10,000 entries/iu,
    );
  },
};

export const DismissWithEscape: Story = {
  play: playStoryEscape,
};
