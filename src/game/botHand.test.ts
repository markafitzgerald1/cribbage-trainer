import {
  type BotShardLookup,
  type PlayingBotHand,
  advanceBotHand,
  playBotHandCard,
  startBotHand,
} from "./botHand";
import { DEALER, GO, PONE, RESET } from "./pegging";
import { Rank, parseCard, parseHand, serializeHand } from "./Card";
import { describe, expect, it, jest } from "@jest/globals";
import { parsePolicyShard } from "./pegPolicyShard";

const deal = {
  botDiscard: parseHand("4H,8H"),
  botKeep: parseHand("5C,5D,9C,QC"),
  playerCards: parseHand("KC,KH,6H,JH,2H,3H"),
  playerSeat: DEALER,
} as const;
const discards = parseHand("2H,3H");
const botKey = "5_5_9_Q";
const HEADER = [67, 80, 83, 49];
const EMPTY_SHARD = parsePolicyShard(Uint8Array.from([...HEADER, 0, 0, 0, 0]));

// Opening, Q-K, and Q-K-5-6-reset. The last menu no longer contains Q.
const HISTORY_DELTAS = [0, 0xdc, 0xf6500];
const MENUS = [
  [Rank.FIVE, Rank.NINE, Rank.QUEEN, 0],
  [Rank.FIVE, Rank.NINE, 0, 0],
  [Rank.FIVE, Rank.NINE, 0, 0],
];
const COUNTS = [100, 400, 500, 500, 500, 500, 500];
const encodeBytes = (value: number, bytes: number): number[] =>
  Array.from(
    { length: bytes },
    (_, offset) => Math.floor(value / 256 ** offset) % 256,
  );
const POLICY = parsePolicyShard(
  Uint8Array.from([
    ...HEADER,
    3,
    0,
    0,
    0,
    ...HISTORY_DELTAS.flatMap((delta) => encodeBytes(delta, 8)),
    ...MENUS.flat(),
    3,
    2,
    2,
    1,
    1,
    0,
    ...COUNTS.flatMap((count) => encodeBytes(count, 2)),
  ]),
);

const play = (state: PlayingBotHand, card: string) =>
  playBotHandCard(state, parseCard(card));

const asPlaying = (state: Awaited<ReturnType<typeof advanceBotHand>>) => {
  if (state.kind !== "pegging") {
    throw new Error(`Expected pegging, got ${state.kind}`);
  }
  return state;
};

describe("one hand against the bot", () => {
  it.each([
    {
      crib: { flushes: 5, total: 12 },
      cutAt: 26,
      dealer: { nobs: 1, total: 9 },
      heels: 0,
      pone: 12,
      starter: "QH",
      totals: [13, 24],
    },
    {
      crib: { flushes: 0, total: 7 },
      cutAt: 18,
      dealer: { nobs: 0, total: 4 },
      heels: 2,
      pone: 10,
      starter: "JD",
      totals: [11, 16],
    },
  ])(
    "plays and counts a whole hand with starter $starter",
    async (expected) => {
      using random = jest
        .spyOn(Math, "random")
        .mockReturnValue((expected.cutAt + 0.5) / 40);
      using cryptoRandom = jest
        .spyOn(crypto, "getRandomValues")
        .mockReturnValueOnce(Uint16Array.of(65535))
        .mockReturnValueOnce(Uint16Array.of(64999))
        .mockReturnValueOnce(Uint16Array.of(64000))
        .mockReturnValueOnce(Uint16Array.of(64999));
      const lookup = jest.fn<BotShardLookup>().mockResolvedValue(POLICY);
      const advance = async (state: PlayingBotHand) =>
        asPlaying(await advanceBotHand(state, lookup));

      const start = startBotHand(deal, discards);
      const opening = await advance(start);
      const second = await advance(asPlaying(play(opening, "KH")));
      const reset = asPlaying(play(second, "6H"));
      const third = await advance(reset);

      expect(() => play(third, "KH")).toThrow("Play a remaining card");

      const fourth = await advance(asPlaying(play(third, "KC")));
      const goes = await advance(await advance(fourth));
      const result = play(goes, "JH");

      expect({
        cards: serializeHand(result.plays.map(({ card }) => card)),
        history: result.pegging.history,
        initialPoints: start.pegging.points,
        seats: result.plays.map(({ seat }) => seat),
        starter: serializeHand([start.starter]),
      }).toStrictEqual({
        cards: "QC,KH,5C,6H,9C,KC,5D,JH",
        history: [
          Rank.QUEEN,
          Rank.KING,
          Rank.FIVE,
          Rank.SIX,
          RESET,
          Rank.NINE,
          Rank.KING,
          Rank.FIVE,
          GO,
          GO,
          RESET,
          Rank.JACK,
        ],
        initialPoints: [0, 0],
        seats: [PONE, DEALER, PONE, DEALER, PONE, DEALER, PONE, DEALER],
        starter: expected.starter,
      });
      expect(result).toMatchObject({
        cribScore: expected.crib,
        handScores: [{ total: expected.pone }, expected.dealer],
        heels: expected.heels,
        kind: "complete",
        pegging: { finished: true, points: [1, 3] },
        totals: expected.totals,
      });
      expect(lookup.mock.calls).toStrictEqual([
        [PONE, botKey],
        [PONE, botKey],
        [PONE, botKey],
      ]);
      expect([
        cryptoRandom.mock.calls.length,
        random.mock.calls.length,
      ]).toStrictEqual([4, 1]);
    },
  );

  it.each([null, EMPTY_SHARD])(
    "reports an absent policy row",
    async (shard) => {
      const start = startBotHand({ ...deal, playerSeat: PONE }, discards);
      const state = asPlaying(play(start, "KC"));
      const lookup = jest.fn(() => shard);
      using cryptoRandom = jest.spyOn(crypto, "getRandomValues");

      await expect(advanceBotHand(state, lookup)).resolves.toStrictEqual({
        handKey: botKey,
        history: 0xd,
        kind: "missing-policy",
        seat: DEALER,
      });
      expect(lookup.mock.calls).toStrictEqual([[DEALER, botKey]]);
      expect(cryptoRandom).not.toHaveBeenCalled();
      expect(state.pegging.history).toStrictEqual([Rank.KING]);
    },
  );

  it.each([
    { cards: [parseCard("2H")], name: "one card" },
    { cards: parseHand("2H,4H"), name: "the bot's card" },
    { cards: [parseCard("2H"), parseCard("2H")], name: "the same card twice" },
    { cards: parseHand("2H,3H,4H"), name: "three cards" },
  ])("rejects $name before cutting", ({ cards }) => {
    using random = jest.spyOn(Math, "random");

    expect(() => startBotHand(deal, cards)).toThrow(
      "Discard two distinct cards",
    );
    expect(random).not.toHaveBeenCalled();
  });

  it("enforces turn ownership and physical card identity", async () => {
    const start = startBotHand(deal, discards);
    const lookup = jest.fn(() => POLICY);
    using cryptoRandom = jest
      .spyOn(crypto, "getRandomValues")
      .mockReturnValueOnce(Uint16Array.of(500));

    expect(() => play(start, "KC")).toThrow("It is the bot's turn");

    const playerTurn = asPlaying(await advanceBotHand(start, lookup));

    await expect(advanceBotHand(playerTurn, lookup)).rejects.toThrow(
      "The player must choose a card",
    );
    expect(() => play(playerTurn, "KD")).toThrow("Play a remaining card");
    expect([
      lookup.mock.calls.length,
      cryptoRandom.mock.calls.length,
    ]).toStrictEqual([1, 1]);
  });
});
