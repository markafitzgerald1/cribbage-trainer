import "@testing-library/jest-dom";
import {
  SIX_SPADES_HAND,
  clickDeal,
  completeDiscardsAndWait,
  mockThrowingStorage,
  renderTrainerWithGenerator,
  renderTrainerWithInitialProps,
  setAnalysisTables,
} from "./Trainer.test.common";
import { describe, expect, it } from "@jest/globals";
import { parseHandKey, toHandKey } from "../ui/handKey";
import { screen, waitFor } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { ownHandKey } from "../ui/ownHandKey";
import { parseHand } from "../game/Card";
import { readDiscardTally } from "../ui/discardTally";
import userEvent from "@testing-library/user-event";

const playDiscards = async (
  props: Parameters<typeof renderTrainerWithInitialProps>[0],
) => {
  const user = userEvent.setup();
  const view = renderTrainerWithInitialProps(props);
  await completeDiscardsAndWait(view.getAllByRole, user);
};

const expectPracticePlay = async (
  props: Parameters<typeof renderTrainerWithInitialProps>[0],
  afterPlay: () => void = () => null,
) => {
  await playDiscards(props);
  afterPlay();

  expect(screen.queryByText("Avg recorded loss")).not.toBeInTheDocument();
};

const resumedHandProps = (key: string) => {
  const parsed = parseHandKey(key)!;
  return {
    generateRandomNumber: () => 0,
    initialCards: parsed.cards,
    initialCribRole: parsed.cribRole,
  };
};

const decideFreshDeal = async (beforeDecide: () => void = () => null) => {
  setAnalysisTables();
  localStorage.clear();
  const user = userEvent.setup();
  const view = renderTrainerWithGenerator(() => 0);
  const storedKey = String(localStorage.getItem(ownHandKey));
  beforeDecide();
  await completeDiscardsAndWait(view.getAllByRole, user);
  return { storedKey, user, view };
};

const dealAwayAndCount = async (user: ReturnType<typeof userEvent.setup>) => {
  await clickDeal(user);
  return readDiscardTally(Date.now());
};

const reloadOwnHand = (storedKey: string, withDiscards: boolean) => {
  const reloadProps = resumedHandProps(storedKey);
  renderTrainerWithInitialProps({
    ...reloadProps,
    initialDiscards: withDiscards
      ? [reloadProps.initialCards[0]!, reloadProps.initialCards[1]!]
      : null,
  });
};

describe("trainer deep-linked and reloaded hands", () => {
  it("counts a reloaded own hand as an authentic decision, not practice", async () => {
    setAnalysisTables();
    localStorage.clear();

    const initialView = renderTrainerWithGenerator(() => 0);
    const storedKey = localStorage.getItem(ownHandKey);

    expect(storedKey).not.toBeNull();

    initialView.unmount();

    await playDiscards(resumedHandProps(String(storedKey)));

    expect(screen.queryByText("Avg recorded loss")).toBeInTheDocument();
  });

  it("treats hand as deep-linked when localStorage throws", async () => {
    setAnalysisTables();
    const getItemSpy = mockThrowingStorage(ownHandKey);

    await expectPracticePlay(
      {
        initialCards: parseHand(SIX_SPADES_HAND),
        initialCribRole: CribRole.Dealer,
      },
      () => getItemSpy.mockRestore(),
    );
  });

  it("does not double count a reloaded already-decided own hand, clears ownHandKey, and records no skip on deal", async () => {
    const { storedKey, user, view } = await decideFreshDeal();

    expect(screen.queryByText("Avg recorded loss")).toBeInTheDocument();

    view.unmount();
    reloadOwnHand(storedKey, true);
    await waitFor(() =>
      expect(screen.getByRole("status")).not.toHaveTextContent(""),
    );

    expect(readDiscardTally(Date.now()).decisions).toBe(1);
    expect(localStorage.getItem(ownHandKey)).toBeNull();

    const tally = await dealAwayAndCount(user);

    expect(tally.skippedHands).toBe(0);
  });

  it("never writes the key during a seeded session or after a seeded deal", async () => {
    localStorage.clear();
    renderTrainerWithInitialProps({
      generateRandomNumber: () => 0,
      isSeededSession: true,
    });

    expect(localStorage.getItem(ownHandKey)).toBeNull();

    await clickDeal(userEvent.setup());

    expect(localStorage.getItem(ownHandKey)).toBeNull();
  });

  it("treats the same cards under the opposite role as a shared link", async () => {
    setAnalysisTables();
    localStorage.clear();
    localStorage.setItem(
      ownHandKey,
      toHandKey(parseHand(SIX_SPADES_HAND), CribRole.Dealer),
    );

    await expectPracticePlay({
      generateRandomNumber: () => 0,
      initialCards: parseHand(SIX_SPADES_HAND),
      initialCribRole: CribRole.Pone,
    });
  });

  it("retires the own-hand marker once the hand is decided, so withdrawing a card and reloading records no skip", async () => {
    const { storedKey, user, view } = await decideFreshDeal();
    await user.click(view.getAllByRole("checkbox")[0]!);

    expect(localStorage.getItem(ownHandKey)).toBeNull();

    view.unmount();
    reloadOwnHand(storedKey, false);
    const tally = await dealAwayAndCount(user);

    expect(tally).toMatchObject({ decisions: 1, skippedHands: 0 });
  });

  it("leaves another tab's own-hand marker alone when this tab decides its hand", async () => {
    const otherTabsKey = toHandKey(parseHand(SIX_SPADES_HAND), CribRole.Pone);

    await decideFreshDeal(() => localStorage.setItem(ownHandKey, otherTabsKey));

    expect(localStorage.getItem(ownHandKey)).toBe(otherTabsKey);
  });
});
