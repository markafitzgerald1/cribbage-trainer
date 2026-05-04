/* jscpd:ignore-start */
import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  type StoryObj,
  createArgTypes,
  toDealtCards,
} from "./stories.common";
/* jscpd:ignore-end */
import { CARDS } from "../game/Card";
import { InteractiveHand } from "./InteractiveHand";

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: InteractiveHand,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "InteractiveHand",
} satisfies Meta<typeof InteractiveHand>;

export default meta;
type Story = StoryObj<typeof meta>;

function createStory(sortOrder: SortOrder): Story {
  return {
    args: {
      dealtCards: toDealtCards([
        CARDS.JACK,
        CARDS.FIVE,
        CARDS.JACK,
        CARDS.ACE,
        CARDS.FOUR,
        CARDS.QUEEN,
      ]),
      onCardChange: () => null,
      onDeal: () => null,
      onSortOrderChange: () => null,
      sortOrder,
    },
  };
}

export const JackFiveJackAceFourQueenDealOrder = createStory(
  SortOrder.DealOrder,
);
export const JackFiveJackAceFourQueenDescending = createStory(
  SortOrder.Descending,
);
export const JackFiveJackAceFourQueenAscending = createStory(
  SortOrder.Ascending,
);
