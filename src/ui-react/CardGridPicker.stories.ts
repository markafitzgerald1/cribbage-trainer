/* jscpd:ignore-start */
import { CARDS, DECK } from "../game/Card";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { CardGridPicker } from "./CardGridPicker";
/* jscpd:ignore-end */

const meta = {
  args: {
    onToggle: fn(),
    selectedCards: [],
    selectionFull: false,
  },
  component: CardGridPicker,
  tags: ["autodocs"],
  title: "CardGridPicker",
} satisfies Meta<typeof CardGridPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "A♣" }),
    );

    await expect(args.onToggle).toHaveBeenCalledWith(CARDS.ACE);
  },
};

export const Full: Story = {
  args: {
    selectedCards: DECK.slice(0, 6),
    selectionFull: true,
  },
};
