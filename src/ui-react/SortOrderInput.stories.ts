import {
  type Meta,
  SORT_ORDER_NAMES,
  SortOrder,
  type StoryObj,
  createArgTypes,
} from "./stories.common";
import { SortOrderInput } from "./SortOrderInput";

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
