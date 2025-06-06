/* jscpd:ignore-start */
import { CARDS, RANK_NAMES, Rank } from "../game/Card";
import type { Meta, StoryObj } from "@storybook/react";
/* jscpd:ignore-end */
import { CardLabel } from "./CardLabel";
/* jscpd:ignore-start */
import { createArgTypes } from "./stories.common";
/* jscpd:ignore-end */

const meta = {
  argTypes: createArgTypes("rank", RANK_NAMES),
  component: CardLabel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "CardLabel",
} satisfies Meta<typeof CardLabel>;

/* jscpd:ignore-start */
export default meta;
type Story = StoryObj<typeof meta>;
const createStory = (rank: number): Story => ({
  args: { rank: rank as Rank },
});

export const Ace = createStory(CARDS.ACE.rank);
export const Five = createStory(CARDS.FIVE.rank);
export const Nine = createStory(CARDS.NINE.rank);
export const Ten = createStory(CARDS.TEN.rank);
export const Jack = createStory(CARDS.JACK.rank);
export const King = createStory(CARDS.KING.rank);
/* jscpd:ignore-end */
