/* jscpd:ignore-start */
import { CARDS, RANK_NAMES, Rank } from "../game/Card";
import type { Meta, StoryObj } from "@storybook/react-vite";
/* jscpd:ignore-end */
import { PossibleHandCard } from "./PossibleHandCard";
/* jscpd:ignore-start */
import { createArgTypes } from "./stories.common";
/* jscpd:ignore-end */

const meta = {
  argTypes: createArgTypes("rank", RANK_NAMES),
  component: PossibleHandCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "PossibleHandCard",
} satisfies Meta<typeof PossibleHandCard>;

/* jscpd:ignore-start */
export default meta;
type Story = StoryObj<typeof meta>;

const createStory = (rank: Rank): Story => ({
  args: { rank },
});

export const Two = createStory(CARDS.TWO.rank);
export const Three = createStory(CARDS.THREE.rank);
export const Seven = createStory(CARDS.SEVEN.rank);
export const Jack = createStory(CARDS.JACK.rank);
export const Queen = createStory(CARDS.QUEEN.rank);
export const King = createStory(CARDS.KING.rank);
/* jscpd:ignore-end */
