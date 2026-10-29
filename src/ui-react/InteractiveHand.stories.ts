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
import { basePanelArgs, sampleVerdict } from "./PracticeDrillPanel.test.common";
import { CARDS } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import { InteractiveHand } from "./InteractiveHand";
import type { UncountedReason } from "./uncountedReason";

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
      cribRole: CribRole.Dealer,
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
      onEnterCards: () => null,
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

const drillStory = (drill: ReturnType<typeof basePanelArgs>): Story => ({
  args: { ...createStory(SortOrder.DealOrder).args, practiceDrill: drill },
});

export const WithPracticeDrillChoosing = drillStory(
  basePanelArgs({ phase: "choosing" }),
);

export const WithPracticeDrillVerdict = drillStory(
  basePanelArgs({ phase: "revealed", verdict: sampleVerdict() }),
);

const uncountedStory = (uncountedReason: UncountedReason): Story => ({
  args: { ...createStory(SortOrder.DealOrder).args, uncountedReason },
});

export const NotCountedLinkedHand = uncountedStory("linked");
export const NotCountedSeededHand = uncountedStory("seeded");
export const NotCountedEnteredHand = uncountedStory("entered");
export const NotCountedRestoredHand = uncountedStory("restored");
export const NotCountedDecidedHand = uncountedStory("decided");
export const NotCountedDrillHand = uncountedStory("drill");
