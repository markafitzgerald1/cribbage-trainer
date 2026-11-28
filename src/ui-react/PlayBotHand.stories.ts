import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  botHandDeal,
  botShard,
  emptyBotShard,
} from "../game/botHand.test.common";
import { expect, fn, userEvent, within } from "storybook/test";
import { PlayBotHand } from "./PlayBotHand";
import { createElement } from "react";

const meta = {
  args: {
    deal: fn(() => Promise.resolve(botHandDeal)),
    lookupShard: fn(() => botShard),
    playerSeat: botHandDeal.playerSeat,
  },
  component: PlayBotHand,
  title: "PlayBotHand",
} satisfies Meta<typeof PlayBotHand>;

export default meta;
type Story = StoryObj<typeof meta>;

async function chooseDiscards(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const clickButton = async (name: string) => {
    await userEvent.click(await canvas.findByRole("button", { name }));
  };
  await clickButton("Deal");
  await clickButton("Discard 2 of hearts");
  await clickButton("Discard 3 of hearts");
  return canvas;
}

const discardAndCut = (canvas: Awaited<ReturnType<typeof chooseDiscards>>) =>
  userEvent.click(canvas.getByRole("button", { name: "Discard and cut" }));

export const WholeHand: Story = {
  decorators: [
    (Story) =>
      createElement(
        "div",
        { style: { colorScheme: "dark" } },
        createElement(Story),
      ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await chooseDiscards(canvasElement);
    const selected = canvas.getByRole("button", {
      name: "Discard 2 of hearts",
      pressed: true,
    });
    const selectedStyle = getComputedStyle(selected);

    await expect(selectedStyle.backgroundColor).toBe("rgb(222, 248, 226)");
    await expect(selectedStyle.color).toBe("rgb(16, 56, 27)");

    await discardAndCut(canvas);
    const pegAt = async (count: number, card: string) => {
      await canvas.findByText(
        new RegExp(`^Your play\\. Count ${count}\\.`, "u"),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: `Play ${card}` }),
      );
    };
    await pegAt(10, "K of hearts");
    await pegAt(25, "6 of hearts");
    await pegAt(9, "K of clubs");
    await pegAt(0, "J of hearts");
    const result = await canvas.findByRole("region", { name: "Hand complete" });

    await expect(result).toHaveTextContent(/You \(dealer\).*Pegging 3\./u);
    await expect(result).toHaveTextContent(/Dealer crib: 2♥ 3♥ 4♥ 8♥/u);
  },
};

export const MissingPolicy: Story = {
  args: { lookupShard: fn(() => emptyBotShard) },
  play: async ({ canvasElement }) => {
    const canvas = await chooseDiscards(canvasElement);
    await discardAndCut(canvas);

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      /policy row is missing/u,
    );
    await expect(canvas.queryByRole("button", { name: /^Play /u })).toBeNull();
  },
};
