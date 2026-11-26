import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { RecordedTableProvenance } from "./RecordedTableProvenance";
import { originalIdentity } from "./PracticeDrillPanel.test.common";
import { shippedTableIdentity } from "../game/tableIdentity";

const PREVIEW_LENGTH = 12;

const meta = {
  args: { identity: null },
  component: RecordedTableProvenance,
  tags: ["autodocs"],
  title: "RecordedTableProvenance",
} satisfies Meta<typeof RecordedTableProvenance>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Unknown: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("Original tables unknown"),
    ).toBeVisible();
  },
};

const expandProvenance: Story["play"] = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  const identity = args.identity!;
  const crib = canvas.getByText(
    `Crib: ${identity.crib.means_sha256.slice(0, PREVIEW_LENGTH)}…`,
  );

  await expect(crib).not.toBeVisible();

  await userEvent.click(canvas.getByText(/Judged with/u));

  await expect(crib).toBeVisible();
  await expect(crib).toHaveAttribute("title", identity.crib.means_sha256);
  await expect(crib).toHaveAccessibleName(
    `Crib table fingerprint ${identity.crib.means_sha256.slice(0, PREVIEW_LENGTH)}`,
  );
  await expect(
    canvas.getByRole("note", {
      name: `Play table fingerprint ${identity.play.means_sha256.slice(0, PREVIEW_LENGTH)}`,
    }),
  ).toBeVisible();
};

export const Different: Story = {
  args: { identity: originalIdentity },
  play: expandProvenance,
};

export const Current: Story = {
  args: { identity: shippedTableIdentity },
  play: expandProvenance,
};
