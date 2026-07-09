/* jscpd:ignore-start */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { CribRole } from "../game/expectedCribPoints";
import { DECK } from "../game/Card";
import { EnterCardsDialog } from "./EnterCardsDialog";
import { SortOrder } from "../ui/SortOrder";
/* jscpd:ignore-end */

const meta = {
  args: {
    initialCards: DECK.slice(0, 6),
    initialCribRole: CribRole.Dealer,
    onClose: fn(),
    onSubmit: fn(),
    show: true,
    sortOrder: SortOrder.Descending,
  },
  component: EnterCardsDialog,
  tags: ["autodocs"],
  title: "EnterCardsDialog",
} satisfies Meta<typeof EnterCardsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadyToEdit: Story = {};

export const EditAndAnalyze: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "A♣", pressed: true }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "7♣" }));
    await userEvent.click(canvas.getByRole("radio", { name: "Pone" }));
    await userEvent.click(canvas.getByRole("button", { name: "Analyze" }));

    await expect(args.onSubmit).toHaveBeenCalledWith(
      [...DECK.slice(1, 6), DECK[6]],
      CribRole.Pone,
    );
  },
};
