import type { Meta, StoryObj } from "@storybook/react";
import { DealButton } from "./DealButton";

const meta = {
  component: DealButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "DealButton",
} satisfies Meta<typeof DealButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onDeal: () => null,
  },
};
