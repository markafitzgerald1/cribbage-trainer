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

const resumedHandProps = (key: string) => {
  const parsed = parseHandKey(key)!;
  return {
    generateRandomNumber: () => 0,
    initialCards: parsed.cards,
    initialCribRole: parsed.cribRole,
  };
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

    expect(screen.queryByText("Lost per discard")).toBeInTheDocument();
  });

  it("treats hand as deep-linked when localStorage throws", async () => {
    setAnalysisTables();
    const getItemSpy = mockThrowingStorage(ownHandKey);

    await playDiscards({
      initialCards: parseHand(SIX_SPADES_HAND),
      initialCribRole: CribRole.Dealer,
    });
    getItemSpy.mockRestore();

    expect(screen.queryByText("Lost per discard")).not.toBeInTheDocument();
  });

  it("does not double count a reloaded already-decided own hand, clears ownHandKey, and records no skip on deal", async () => {
    setAnalysisTables();
    localStorage.clear();

    const user = userEvent.setup();
    const initialView = renderTrainerWithGenerator(() => 0);
    const storedKey = String(localStorage.getItem(ownHandKey));

    await completeDiscardsAndWait(initialView.getAllByRole, user);

    expect(screen.queryByText("Lost per discard")).toBeInTheDocument();

    initialView.unmount();
    const reloadProps = resumedHandProps(storedKey);

    renderTrainerWithInitialProps({
      ...reloadProps,
      initialDiscards: [
        reloadProps.initialCards[0]!,
        reloadProps.initialCards[1]!,
      ],
    });

    await waitFor(() =>
      expect(screen.getByRole("status")).not.toHaveTextContent(""),
    );

    expect(readDiscardTally(Date.now()).decisions).toBe(1);
    expect(localStorage.getItem(ownHandKey)).toBeNull();

    await clickDeal(user);

    expect(readDiscardTally(Date.now()).skippedHands).toBe(0);
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

    await playDiscards({
      generateRandomNumber: () => 0,
      initialCards: parseHand(SIX_SPADES_HAND),
      initialCribRole: CribRole.Pone,
    });

    expect(screen.queryByText("Lost per discard")).not.toBeInTheDocument();
  });
});
