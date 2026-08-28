/* jscpd:ignore-start */
import * as classes from "./MistakeQueueDialog.module.css";
import { DIALOG_ROLE_OPTIONS, DialogFilterGroup } from "./DialogFilterGroup";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, within } from "storybook/test";

const meta = {
  argTypes: {
    currentValue: {
      control: "radio",
      options: ["all", "dealer", "pone"],
    },
  },
  component: DialogFilterGroup,
  tags: ["autodocs"],
  title: "DialogFilterGroup",
} satisfies Meta<typeof DialogFilterGroup>;

export default meta;
type Story = StoryObj<typeof meta>;
/* jscpd:ignore-end */

export const Default: Story = {
  args: {
    classes,
    currentValue: "all",
    groupName: "role-filter",
    legendText: "Crib role",
    onChange: fn(),
    options: DIALOG_ROLE_OPTIONS,
  },
};

export const DealerSelected: Story = {
  args: {
    classes,
    currentValue: "dealer",
    groupName: "role-filter-dealer",
    legendText: "Crib role",
    onChange: fn(),
    options: DIALOG_ROLE_OPTIONS,
  },
};

export const PoneSelected: Story = {
  args: {
    classes,
    currentValue: "pone",
    groupName: "role-filter-pone",
    legendText: "Crib role",
    onChange: fn(),
    options: DIALOG_ROLE_OPTIONS,
  },
};

export const ChangeSelection: Story = {
  args: {
    classes,
    currentValue: "all",
    groupName: "role-filter-interactive",
    legendText: "Crib role",
    onChange: fn(),
    options: DIALOG_ROLE_OPTIONS,
  },
  play: async ({ canvasElement, args }) => {
    const dealerRadio = within(canvasElement).getByRole("radio", {
      name: "Dealer",
    });
    await fireEvent.click(dealerRadio);

    await expect(args.onChange).toHaveBeenCalled();
  },
};
