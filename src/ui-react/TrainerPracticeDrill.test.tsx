/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import {
  DEALER_RANDOM_VALUE,
  clickIndices,
  createRoleRandomValues,
  createSequenceGenerator,
  getHandText,
  renderTrainerWithInitialProps,
} from "./Trainer.test.common";
import {
  clearDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
} from "../ui/discardTally";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { parseHand } from "../game/Card";
import userEvent from "@testing-library/user-event";
/* jscpd:ignore-end */

const MISTAKE_HAND = "5H,6H,7H,8H,9H,10H";

const seedMistakeHand = () => {
  clearDiscardTally();
  recordDiscardDecision({
    at: Date.now(),
    cribRole: CribRole.Dealer,
    discardKey: "5H,6H",
    expectedPointsLoss: 1.5,
    handKey: `${MISTAKE_HAND}|Dealer`,
    isOptimal: false,
    isPractice: false,
  });
};

type DrillView = ReturnType<typeof renderTrainerWithInitialProps>;

const clickDrillButton = (
  view: DrillView,
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => user.click(view.getByRole("button", { name }));

const openDrillFromQueue = async () => {
  seedMistakeHand();
  const user = userEvent.setup();
  const view = renderTrainerWithInitialProps({
    generateRandomNumber: createSequenceGenerator(
      createRoleRandomValues([DEALER_RANDOM_VALUE]),
    ),
    initialCards: parseHand(MISTAKE_HAND),
    initialCribRole: CribRole.Dealer,
    initialDiscards: parseHand("5H,6H"),
  });

  await clickDrillButton(view, user, "Mistake queue");
  await clickDrillButton(view, user, "Practice this");

  return { user, view };
};

const commitDrillChoice = async (
  view: DrillView,
  user: ReturnType<typeof userEvent.setup>,
) => {
  await clickIndices(view.getAllByRole, [0, 1], user);
  await clickDrillButton(view, user, "Check discard");
};

describe("trainer practice drill", () => {
  it("withholds the analysis until the drill choice is committed", async () => {
    const { user, view } = await openDrillFromQueue();

    expect(view.queryByRole("table")).toBeNull();

    await commitDrillChoice(view, user);

    expect(view.getByRole("table")).toBeInTheDocument();
    expect(screen.getByLabelText("Practice drill")).toBeInTheDocument();
  });

  it("records the re-attempt as practice without moving the lifetime tally", async () => {
    const { user, view } = await openDrillFromQueue();

    await commitDrillChoice(view, user);
    const tally = readTallyForDisplay();

    expect(tally.practice).toHaveLength(1);
    expect(tally.lifetime.decisions).toBe(1);
  });

  it("deals a fresh authentic hand after exiting the drill", async () => {
    const { user, view } = await openDrillFromQueue();
    const drilledHandText = getHandText(view.container);

    await clickDrillButton(view, user, "Exit drill");

    expect(screen.queryByLabelText("Practice drill")).toBeNull();
    expect(view.queryByRole("button", { name: "Check discard" })).toBeNull();
    expect(getHandText(view.container)).not.toBe(drilledHandText);
    expect(view.getAllByRole("checkbox")).toHaveLength(6);
    expect(
      screen.getByText("Practice ended — fresh hand dealt."),
    ).toBeInTheDocument();
  });

  it("ends a choosing-phase drill when Back restores the same hand", async () => {
    const { view } = await openDrillFromQueue();

    // Back onto the completed state that preceded the drill: same six cards and role, its original discard restored.
    window.history.replaceState(
      null,
      "",
      `?hand=${MISTAKE_HAND}&role=dealer&discard=5H,6H`,
    );
    fireEvent.popState(window);

    expect(screen.queryByLabelText("Practice drill")).toBeNull();
    expect(view.getByRole("table")).toBeInTheDocument();
  });
});
