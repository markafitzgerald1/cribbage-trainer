/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import {
  clearDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
} from "../ui/discardTally";
import {
  clickIndices,
  renderTrainerWithInitialProps,
} from "./Trainer.test.common";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import { parseHand } from "../game/Card";
import { screen } from "@testing-library/react";
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

  it("leaves the hand on the board after exiting the drill", async () => {
    const { user, view } = await openDrillFromQueue();

    await clickDrillButton(view, user, "Exit drill");

    expect(view.queryByRole("button", { name: "Check discard" })).toBeNull();
    expect(view.getAllByRole("checkbox")).toHaveLength(6);
  });
});
