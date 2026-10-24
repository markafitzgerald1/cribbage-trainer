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
import { formatOwnHand, ownHandKey } from "../ui/ownHandKey";
import { screen, waitFor } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { getInitialProps } from "../ui/getInitialProps";
import { parseHand } from "../game/Card";
import { readDiscardTally } from "../ui/discardTally";
import { toHandKey } from "../ui/handKey";
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

const reloadFromUrl = () => {
  const { initialCards, initialCribRole, initialDiscards, initialOwnHandId } =
    getInitialProps(window.location.search);
  return renderTrainerWithInitialProps({
    generateRandomNumber: () => 0,
    initialCards,
    initialCribRole,
    initialDiscards,
    initialOwnHandId,
  });
};

const startWithNoHistory = () => {
  setAnalysisTables();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
};

const decideFreshDeal = async (beforeDecide: () => void = () => null) => {
  startWithNoHistory();
  const user = userEvent.setup();
  const view = renderTrainerWithGenerator(() => 0);
  beforeDecide();
  await completeDiscardsAndWait(view.getAllByRole, user);
  return { user, view };
};

const dealAwayAndCount = async (user: ReturnType<typeof userEvent.setup>) => {
  await clickDeal(user);
  return readDiscardTally(Date.now());
};

const SPADES_DEALER_KEY = toHandKey(
  parseHand(SIX_SPADES_HAND),
  CribRole.Dealer,
);

describe("trainer deep-linked and reloaded hands", () => {
  it("counts a reloaded own hand as an authentic decision, not practice", async () => {
    startWithNoHistory();

    renderTrainerWithGenerator(() => 0).unmount();
    const reloaded = reloadFromUrl();
    await completeDiscardsAndWait(reloaded.getAllByRole, userEvent.setup());

    expect(screen.queryByText("Avg recorded loss")).toBeInTheDocument();
  });

  it("treats hand as deep-linked when localStorage throws", async () => {
    setAnalysisTables();
    const getItemSpy = mockThrowingStorage(ownHandKey);

    await expectPracticePlay(
      {
        initialCards: parseHand(SIX_SPADES_HAND),
        initialCribRole: CribRole.Dealer,
        initialOwnHandId: "any-id",
      },
      () => getItemSpy.mockRestore(),
    );
  });

  it("does not double count a reloaded already-decided own hand, clears ownHandKey, and records no skip on deal", async () => {
    const { user, view } = await decideFreshDeal();

    expect(screen.queryByText("Avg recorded loss")).toBeInTheDocument();

    view.unmount();
    reloadFromUrl();
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

  it.each([
    {
      description: "the same cards under the opposite role",
      id: "mine",
      role: CribRole.Pone,
    },
    {
      description: "a link to the identical hand and role carrying another id",
      id: "another-deal",
      role: CribRole.Dealer,
    },
    {
      description: "a link to the identical hand and role carrying no id",
      id: null,
      role: CribRole.Dealer,
    },
  ])("treats $description as a shared link", async ({ id, role }) => {
    startWithNoHistory();
    localStorage.setItem(ownHandKey, formatOwnHand("mine", SPADES_DEALER_KEY));

    await expectPracticePlay({
      generateRandomNumber: () => 0,
      initialCards: parseHand(SIX_SPADES_HAND),
      initialCribRole: role,
      initialOwnHandId: id,
    });
  });

  it("retires the own-hand marker once the hand is decided, so withdrawing a card and reloading records no skip", async () => {
    const { user, view } = await decideFreshDeal();
    await user.click(view.getAllByRole("checkbox")[0]!);

    expect(localStorage.getItem(ownHandKey)).toBeNull();

    view.unmount();
    reloadFromUrl();
    const tally = await dealAwayAndCount(user);

    expect(tally).toMatchObject({ decisions: 1, skippedHands: 0 });
  });

  it("leaves another tab's own-hand marker alone when this tab decides its hand", async () => {
    const otherTabsMarker = formatOwnHand("tab-b", SPADES_DEALER_KEY);

    await decideFreshDeal(() =>
      localStorage.setItem(ownHandKey, otherTabsMarker),
    );

    expect(localStorage.getItem(ownHandKey)).toBe(otherTabsMarker);
  });
});
