/* jscpd:ignore-start */
import type { Meta } from "@storybook/react";
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { Trainer } from "./Trainer";
import { createArgTypes } from "./stories.common";
/* jscpd:ignore-end */
import { createGenerator } from "../game/randomNumberGenerator";

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: Trainer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Trainer",
} satisfies Meta<typeof Trainer>;

export default meta;

export const TrainerStory = {
  args: {
    generateRandomNumber: createGenerator(),
  },
};
