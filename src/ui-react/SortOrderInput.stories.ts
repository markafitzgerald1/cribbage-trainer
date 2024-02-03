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

export const DealOrder: Story = {
  args: {
    sortOrder: SortOrder.DealOrder,
  },
};

export const Ascending: Story = {
  args: {
    sortOrder: SortOrder.Ascending,
  },
};

export const Descending: Story = {
  args: {
    sortOrder: SortOrder.Descending,
  },
};
