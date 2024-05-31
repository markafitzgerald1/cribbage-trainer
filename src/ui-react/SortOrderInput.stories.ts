import type { Meta, StoryObj } from "@storybook/react";
/* jscpd:ignore-start */
import { SORT_ORDER_NAMES } from "../ui/SortOrderName";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";
import { createArgTypes } from "./stories.common";
/* jscpd:ignore-end */

const meta = {
  argTypes: createArgTypes("sortOrder", SORT_ORDER_NAMES),
  component: SortOrderInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "SortOrderInput",
} satisfies Meta<typeof SortOrderInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const createStoryWithSortOrder = (sortOrder: SortOrder) => ({
  args: {
    onChange: () => null,
    sortOrder,
  },
});

export const DealOrder: Story = createStoryWithSortOrder(SortOrder.DealOrder);
export const Ascending: Story = createStoryWithSortOrder(SortOrder.Ascending);
export const Descending: Story = createStoryWithSortOrder(SortOrder.Descending);
