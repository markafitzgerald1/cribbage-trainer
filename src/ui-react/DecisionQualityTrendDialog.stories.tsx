/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { CribRole } from "../game/expectedCribPoints";
import { DecisionQualityTrendDialog } from "./DecisionQualityTrendDialog";
import { type StoredTally } from "../ui/discardTally";

const sampleTally: StoredTally = {
  lifetime: {
    decisions: 30,
    expectedPointsLossTotal: 7.5,
    optimalDecisions: 20,
    skippedHands: 3,
  },
  records: Array.from({ length: 30 }, (_, index) => ({
    at: 1700000000000 + index * 3600000,
    cribRole: index % 2 === 0 ? CribRole.Dealer : CribRole.Pone,
    expectedPointsLoss: index % 3 === 0 ? 0 : 0.25 * (index % 5),
    handKey: `hand-${index}`,
    isOptimal: index % 3 === 0,
    isPractice: false,
  })),
  revision: 1,
  skipped: [{ at: 1700000000000 + 10000 }],
  version: 1,
};

const cappedTally: StoredTally = {
  lifetime: {
    decisions: 20000,
    expectedPointsLossTotal: 5000,
    optimalDecisions: 15000,
    skippedHands: 100,
  },
  records: Array.from({ length: 20000 }, (_, index) => ({
    at: 1700000000000 + index * 1000,
    cribRole: CribRole.Dealer,
    expectedPointsLoss: 0.25,
    handKey: `capped-${index}`,
    isOptimal: false,
    isPractice: false,
  })),
  revision: 1,
  skipped: [],
  version: 1,
};

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
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("heading", { name: "Decision quality over time" }),
    ).toBeVisible();

    const dayRadio = canvas.getByRole("radio", { name: "Day" });
    await userEvent.click(dayRadio);

    await expect(dayRadio).toBeChecked();
  },
};

export const FilterByRole: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dealerRadio = canvas.getByRole("radio", { name: "Dealer" });
    await userEvent.click(dealerRadio);

    await expect(dealerRadio).toBeChecked();
  },
};

export const AtRecordCap: Story = {
  args: {
    tally: cappedTally,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(/retain up to 20,000 entries/iu),
    ).toBeVisible();
  },
};

export const DismissWithEscape: Story = {
  play: async ({ args }) => {
    await userEvent.keyboard("{Escape}");

    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};
/* jscpd:ignore-end */
