import { DEALER, PONE } from "./pegging";
import { describe, expect, it, jest } from "@jest/globals";
import { dealBotHand } from "./botHandDeal";
import { serializeHand } from "./Card";

describe("dealBotHand", () => {
  it.each([
    {
      botHand: "AD,10C,5D,9H,KC,AS",
      draws: [8, 4, 9, 25, 6, 28],
      expectedDiscard: "KC,10C",
      playerSeat: PONE,
    },
    {
      botHand: "4C,5D,7D,3H,2S,9D",
      draws: [0, 10, 11, 19, 30, 12],
      expectedDiscard: "9D,7D",
      playerSeat: DEALER,
    },
  ] as const)(
    "deals two distinct hands and discards $expectedDiscard",
    async (testCase) => {
      const { botHand, draws, expectedDiscard, playerSeat } = testCase;
      using random = jest.spyOn(Math, "random");
      using storage = jest.spyOn(Storage.prototype, "setItem");
      const deckSize = 52;
      [0, 0, 0, 13, 1, 1, ...draws].forEach((position, dealt) => {
        random.mockReturnValueOnce((position + 0.5) / (deckSize - dealt));
      });

      const deal = await dealBotHand(playerSeat);

      expect([deal.playerSeat, serializeHand(deal.playerCards)]).toStrictEqual([
        playerSeat,
        "AC,2C,3C,4D,5C,6C",
      ]);
      expect(serializeHand(deal.botDiscard)).toBe(expectedDiscard);
      expect(
        serializeHand([...deal.botKeep, ...deal.botDiscard])
          .split(",")
          .sort(),
      ).toStrictEqual(botHand.split(",").sort());
      expect(random).toHaveBeenCalledTimes(12);
      expect(storage).not.toHaveBeenCalled();
    },
  );
});
