import type { Meta, StoryObj } from "@storybook/react";

import { Card } from "../ui-react/Card";

const meta = {
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Card",
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const dealtCards = [
  {
    count: 1,
    dealOrder: 0,
    kept: false,
    rankLabel: "A",
    rankValue: 0,
  },
  {
    count: 5,
    dealOrder: 1,
    kept: true,
    rankLabel: "5",
    rankValue: 4,
  },
  {
    count: 9,
    dealOrder: 2,
    kept: true,
    rankLabel: "9",
    rankValue: 8,
  },
  {
    count: 10,
    dealOrder: 3,
    kept: true,
    rankLabel: "10",
    rankValue: 9,
  },
  {
    count: 10,
    dealOrder: 4,
    kept: true,
    rankLabel: "J",
    rankValue: 10,
  },
  {
    count: 10,
    dealOrder: 5,
    kept: false,
    rankLabel: "K",
    rankValue: 12,
  },
];

export const DiscardedFirstCardAce: Story = {
  args: {
    dealOrderIndex: 0,
    dealtCards,
  },
};

export const KeptSecondCardFive: Story = {
  args: {
    dealOrderIndex: 1,
    dealtCards,
  },
};

export const KeptThirdCardNine: Story = {
  args: {
    dealOrderIndex: 2,
    dealtCards,
  },
};

export const KeptFourthCardTen: Story = {
  args: {
    dealOrderIndex: 3,
    dealtCards,
  },
};

export const KeptFifthCardJack: Story = {
  args: {
    dealOrderIndex: 4,
    dealtCards,
  },
};

export const DiscardedFifthCardKing: Story = {
  args: {
    dealOrderIndex: 5,
    dealtCards,
  },
};
