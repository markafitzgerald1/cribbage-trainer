import { type Meta, type StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { NoiseVerdictBadge } from "./NoiseVerdictBadge";
import { type RoleLossPairLabel } from "../analysis/oppositeRoleLoss";

const singleFigure: RoleLossPairLabel = {
  accessibleLabel: "0.06 points lost",
  leadingText: "",
  oppositeRoleCost: "0.06 pts lost",
  oppositeRoleCostsNothing: false,
};

const tapBadgeAndExpectThreshold = async (root: HTMLElement) => {
  await userEvent.click(within(root).getByRole("button"));

  await expect(
    within(root).getByText(/^Approximate threshold 0\.07 pts/u),
  ).toBeVisible();
};

const meta = {
  component: NoiseVerdictBadge,
  title: "NoiseVerdictBadge",
} satisfies Meta<typeof NoiseVerdictBadge>;

export default meta;

export const RevealsThresholdOnTap: StoryObj<typeof meta> = {
  args: {
    rolePair: singleFigure,
    threshold: 0.07,
    title: "Within noise: at or below the approximate 0.07 point threshold.",
  },
  play: async ({ canvasElement }) => {
    await tapBadgeAndExpectThreshold(canvasElement);
  },
};
