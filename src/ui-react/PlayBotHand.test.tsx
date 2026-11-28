import { type BotHandDeal, dealBotHand } from "../game/botHandDeal";
import { DEALER, GO, PONE, RESET, historyKey } from "../game/pegging";
import {
  POLICY_DENOMINATOR,
  type PolicyRow,
  type PolicyShard,
} from "../game/pegPolicyShard";
import { Rank, parseHand } from "../game/Card";
import {
  botHandDeal,
  botShard,
  emptyBotShard,
} from "../game/botHand.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { type BotShardLookup } from "../game/botHand";
import { PlayBotHand } from "./PlayBotHand";

jest.mock("../game/botHandDeal");

const button = (name: string): HTMLButtonElement =>
  screen.getByRole("button", { name });
const click = (name: string) => fireEvent.click(button(name));
const cut = () => {
  click("Discard 2 of hearts");
  click("Discard 3 of hearts");
  click("Discard and cut");
};
const cutAtQueen = () => jest.spyOn(Math, "random").mockReturnValue(26.5 / 40);

const policyShardFromRows = (
  rows: ReadonlyMap<number, PolicyRow>,
): PolicyShard => ({
  lookup: (key) => rows.get(key) ?? null,
  rowCount: rows.size,
});

const mount = (
  lookupShard: BotShardLookup,
  playerSeat: BotHandDeal["playerSeat"] = DEALER,
  deal: typeof dealBotHand = () =>
    Promise.resolve({ ...botHandDeal, playerSeat }),
) =>
  render(
    <PlayBotHand
      deal={deal}
      lookupShard={lookupShard}
      playerSeat={playerSeat}
    />,
  );

const openDeal = async () => {
  click("Deal");
  await screen.findByRole("group", { name: "Your deal" });
};

describe("play a hand against the bot", () => {
  it("commits exactly two discards before drawing the starter", async () => {
    using random = cutAtQueen();
    const defaultDeal = jest.mocked(dealBotHand).mockResolvedValue(botHandDeal);
    render(
      <PlayBotHand
        lookupShard={() => botShard}
        playerSeat={DEALER}
      />,
    );

    click("Deal");

    expect(screen.getByRole("status").textContent).toBe("Dealing…");

    await screen.findByRole("group", { name: "Your deal" });

    expect(defaultDeal).toHaveBeenCalledWith(DEALER);

    const requiresTwo = button("Discard and cut").disabled;
    click("Discard 2 of hearts");
    click("Discard 3 of hearts");
    const capped = button("Discard K of clubs").disabled;
    const pressed = button("Discard 2 of hearts").getAttribute("aria-pressed");
    click("Discard 2 of hearts");

    expect({
      capped,
      pressed,
      requiresTwo,
      selectionReopened: !button("Discard K of clubs").disabled,
      stillRequiresTwo: button("Discard and cut").disabled,
    }).toStrictEqual({
      capped: true,
      pressed: "true",
      requiresTwo: true,
      selectionReopened: true,
      stillRequiresTwo: true,
    });
    expect(random).not.toHaveBeenCalled();
  });

  it("plays the stored policy, respects physical cards and counts the hand", async () => {
    using random = cutAtQueen();
    const lookup = jest.fn<BotShardLookup>().mockResolvedValue(botShard);
    mount(lookup);

    await openDeal();
    cut();
    const opening = await screen.findByText(/^Your play\. Count 10\./u);

    expect({
      cutDraws: random.mock.calls.length,
      opening: opening.textContent,
      starter: screen.getByText("Starter: Q♥. Heels: 0.").textContent,
    }).toStrictEqual({
      cutDraws: 1,
      opening: "Your play. Count 10. Pegging: you 0, bot 0.",
      starter: "Starter: Q♥. Heels: 0.",
    });
    expect(screen.queryByText(/Dealer crib/u)).toBeNull();

    click("Play K of hearts");
    await screen.findByText(/^Your play\. Count 25\./u);

    expect(button("Play K of clubs").disabled).toBe(true);
    expect(
      screen.queryByRole("button", { name: "Play K of hearts" }),
    ).toBeNull();

    click("Play 6 of hearts");
    await screen.findByText("Your play. Count 9. Pegging: you 2, bot 0.");
    click("Play K of clubs");
    await screen.findByText("Your play. Count 0. Pegging: you 2, bot 1.");
    click("Play J of hearts");

    const result = await screen.findByRole("region", { name: "Hand complete" });

    expect({
      history: within(screen.getByRole("list", { name: "Pegging history" }))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
      scores: within(result)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
      shardCalls: lookup.mock.calls,
    }).toStrictEqual({
      history: [
        "Bot played Q♣",
        "You played K♥",
        "Bot played 5♣",
        "You played 6♥",
        "Reset",
        "Bot played 9♣",
        "You played K♣",
        "Bot played 5♦",
        "Go",
        "Go",
        "Reset",
        "You played J♥",
      ],
      scores: [
        "Bot (pone): 5♣ 5♦ 9♣ Q♣ for 12. Pegging 1. Total 13.",
        "You (dealer): K♣ K♥ 6♥ J♥ for 9. Pegging 3. Total 24.",
        "Dealer crib: 2♥ 3♥ 4♥ 8♥ for 12.",
        "Dealer heels: 0.",
      ],
      shardCalls: [
        [PONE, "5_5_9_Q"],
        [PONE, "5_5_9_Q"],
        [PONE, "5_5_9_Q"],
      ],
    });
  });

  it("renders a full pone hand with 15 pegging events", async () => {
    const deal: BotHandDeal = {
      ...botHandDeal,
      botKeep: parseHand("8C,9C,QC,KC"),
      playerCards: parseHand("2C,3C,4C,10C,2H,3H"),
      playerSeat: PONE,
    };
    const throughReset = [
      Rank.TEN,
      Rank.KING,
      Rank.FOUR,
      GO,
      Rank.THREE,
      GO,
      Rank.TWO,
      GO,
      GO,
      RESET,
    ] as const;
    const policyRows = new Map([
      [
        historyKey([Rank.TEN]),
        {
          counts: [0, 0, 0, POLICY_DENOMINATOR],
          ranks: [Rank.EIGHT, Rank.NINE, Rank.QUEEN, Rank.KING],
          supported: true,
        },
      ],
      [
        historyKey(throughReset),
        {
          counts: [0, 0, POLICY_DENOMINATOR],
          ranks: [Rank.EIGHT, Rank.NINE, Rank.QUEEN],
          supported: true,
        },
      ],
      [
        historyKey([...throughReset, Rank.QUEEN, GO]),
        {
          counts: [0, POLICY_DENOMINATOR],
          ranks: [Rank.EIGHT, Rank.NINE],
          supported: true,
        },
      ],
    ]);
    const shard = policyShardFromRows(policyRows);
    mount(
      () => shard,
      PONE,
      () => Promise.resolve(deal),
    );

    await openDeal();
    cut();
    click("Play 10 of clubs");
    await screen.findByText(/^Your play\. Count 20\./u);
    click("Play 4 of clubs");
    await screen.findByText(/^Your play\. Count 24\./u);
    click("Play 3 of clubs");
    await screen.findByText(/^Your play\. Count 27\./u);
    click("Play 2 of clubs");

    const result = await screen.findByRole("region", { name: "Hand complete" });
    const history = within(
      screen.getByRole("list", { name: "Pegging history" }),
    );

    expect(
      history.getAllByRole("listitem").map((item) => item.textContent),
    ).toStrictEqual([
      "You played 10♣",
      "Bot played K♣",
      "You played 4♣",
      "Go",
      "You played 3♣",
      "Go",
      "You played 2♣",
      "Go",
      "Go",
      "Reset",
      "Bot played Q♣",
      "Go",
      "Bot played 9♣",
      "Go",
      "Bot played 8♣",
    ]);
    expect(
      within(result)
        .getAllByRole("listitem")
        .slice(0, 2)
        .map((item) => item.textContent?.split(":")[0]),
    ).toStrictEqual(["You (pone)", "Bot (dealer)"]);
  });

  it("keeps the active deal and pegging seat when the requested seat changes", async () => {
    const deal = () => Promise.resolve(botHandDeal);
    const lookupShard = () => botShard;
    const { rerender } = mount(lookupShard, DEALER, deal);

    click("Deal");
    rerender(
      <PlayBotHand
        deal={deal}
        lookupShard={lookupShard}
        playerSeat={PONE}
      />,
    );

    expect(screen.getByText("You are the dealer.")).toBeTruthy();

    await screen.findByRole("group", { name: "Your deal" });

    expect(screen.getByText("You are the dealer.")).toBeTruthy();

    cut();
    await screen.findByText(/^Your play\. Count 10\./u);

    expect(screen.getByText("You are the dealer.")).toBeTruthy();
  });

  it("locks play while the shard is pending and stops on a missing row", async () => {
    const delivery: { resolve?: (shard: PolicyShard | null) => void } = {};
    const pending = new Promise<PolicyShard | null>((resolve) => {
      delivery.resolve = resolve;
    });
    const lookup = jest.fn<BotShardLookup>().mockReturnValue(pending);
    const poneDeal: BotHandDeal = {
      ...botHandDeal,
      playerCards: parseHand("KC,KH,6H,QH,2H,3H"),
      playerSeat: PONE,
    };
    mount(lookup, PONE, () => Promise.resolve(poneDeal));

    await openDeal();
    cut();

    expect(screen.getByText("You are the pone.")).toBeTruthy();

    click("Play K of clubs");

    expect(button("Play Q of hearts").disabled).toBe(true);
    expect(lookup).toHaveBeenCalledWith(DEALER, "5_5_9_Q");

    delivery.resolve!(emptyBotShard);
    const alert = await screen.findByRole("alert");

    expect(alert.textContent).toBe(
      "Pegging stopped because the bot policy row is missing.",
    );
    expect(
      screen.queryByRole("group", { name: "Your remaining cards" }),
    ).toBeNull();
  });

  it("shows a dealing failure", async () => {
    const fail = jest
      .fn<typeof dealBotHand>()
      .mockRejectedValue(new Error("table failure"));
    mount(() => botShard, DEALER, fail);

    click("Deal");

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not deal the hand.",
    );
  });

  it("shows a shard lookup rejection", async () => {
    const fail = jest
      .fn<BotShardLookup>()
      .mockRejectedValue(new Error("shard failure"));
    mount(fail);

    await openDeal();
    cut();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not use the bot pegging policy.",
    );
  });
});
