import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";
import {
  expectStoryNote,
  expectStoryTextVisible,
  playPracticeFromDecisionMarker,
  playStoryEscape,
  selectStoryRadioOption,
} from "./stories.common";
import { DecisionQualityTrendDialog } from "./DecisionQualityTrendDialog";
import { SortOrder } from "../ui/SortOrder";
import dialogFixtures from "./DecisionQualityTrendDialog.test.common";

const sampleTally = dialogFixtures.dialogTally(30);
const cappedTally = dialogFixtures.cappedDialogTally();
const practiceReadyTally = dialogFixtures.practiceReadyDialogTally();

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

export const PracticeFromChartMistake: Story = {
  args: {
    onStartDrill: fn(),
    sortOrder: SortOrder.Descending,
    tally: practiceReadyTally,
  },
  play: ({ args, canvasElement }) =>
    playPracticeFromDecisionMarker(canvasElement, args.onStartDrill),
};

export const RecordedCalendarLoss: Story = {
  args: {
    initialGranularity: "day",
    tally: {
      ...practiceReadyTally,
      lifetime: {
        decisions: 1,
        expectedPointsLossTotal: 0.004,
        optimalDecisions: 0,
        skippedHands: 0,
      },
      records: practiceReadyTally.records
        .slice(0, 1)
        .map((record) => ({ ...record, expectedPointsLoss: 0.004 })),
    },
  },
  play: async ({ canvas, canvasElement }) => {
    const history = within(
      canvas.getByRole("table", { name: "Recorded decision history" }),
    );

    await expect(
      history.getByRole("note", {
        name: /^Recorded loss for .+: less than 0\.01 points per discard$/u,
      }),
    ).toHaveTextContent("< 0.01");

    await expectStoryNote(
      canvasElement,
      "Recorded loss overall: less than 0.01 points per discard",
      "< 0.01",
    );
  },
};

export const EmptyRecordedHistory: Story = {
  args: { tally: dialogFixtures.emptyDialogTally() },
  play: async ({ canvas, canvasElement }) => {
    await expectStoryNote(
      canvasElement,
      "Recorded loss overall unavailable",
      "—",
    );

    await expect(
      canvas.getByText("No discard decisions recorded yet for this view."),
    ).toBeVisible();
  },
};

export const SkippedCalendarPeriod: Story = {
  args: {
    initialGranularity: "day",
    tally: dialogFixtures.skipOnlyDialogTally(),
  },
  play: async ({ canvas, canvasElement }) => {
    const unavailable = canvas.getByRole("note", {
      name: /^Recorded loss for .+ unavailable$/u,
    });

    await expect(unavailable).toHaveTextContent("—");
    await expect(unavailable.closest("tr")).toHaveTextContent("1 (100.0%)");
    await expect(
      canvas.getByRole("group", {
        name: "Decision quality over time trend chart",
      }),
    ).toHaveAccessibleDescription(/Latest scored period/u);

    await selectStoryRadioOption(canvasElement, "Pone");

    await expectStoryNote(
      canvasElement,
      "Recorded loss overall unavailable",
      "—",
    );
  },
};

export const BestRecordedCalendarChoice: Story = {
  args: {
    initialGranularity: "day",
    tally: dialogFixtures.multiLossDialogTally(),
  },
  play: async ({ canvas }) => {
    const bestPeriod = canvas.getByRole("note", {
      name: /^Recorded loss for .+: 0\.00 points per discard$/u,
    });

    await expect(bestPeriod).toHaveTextContent("0.00");
    await expect(bestPeriod.closest("tr")).toHaveTextContent("100.0%");
  },
};
