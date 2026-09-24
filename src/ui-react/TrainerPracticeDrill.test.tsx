/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import {
  DEALER_RANDOM_VALUE,
  clickIndices,
  createRoleRandomValues,
  createSequenceGenerator,
  getHandText,
  renderTrainerWithInitialProps,
  setAnalysisTables,
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

/*
 * Testing Library's own async timeout is one second and jest's `testTimeout`
 * does not govern it, so every wait for the lazily loaded analysis needs its
 * own contention margin or it fails before the raised jest budget can help.
 *
 * This must stay strictly and generously below that budget, because a wait
 * that expires says "unable to find element" while a test that runs out of
 * budget says only that it timed out — and a test here can spend this wait
 * twice, so a legitimate slow first wait plus a fully expired second one has
 * to still land inside the budget. 8000 against 15000 does: under the
 * starvation rig that reproduces #804 the worst analysis wait measured
 * 3825ms and the worst test 10818ms, so the wait keeps a 2.1x margin while
 * the budget is what binds first — which is the ordering that matters, since
 * a wait that bound first would become the next flake.
 */
const waitForAnalysis = { timeout: 8000 };

const seedMistakeHand = () => {
  setAnalysisTables();
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

const findAnalysisTable = (view: DrillView) =>
  view.findByRole("table", {}, waitForAnalysis);

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

  /*
   * The pre-drill analysis has to be on screen before the drill opens, or
   * "withholds the analysis" passes vacuously: a table that never rendered
   * is trivially absent, so the assertion would hold against a Trainer that
   * withholds nothing. Waiting is also the Jest counterpart of the rule
   * `skills/testing-e2e/SKILL.md` states for Playwright.
   */
  await findAnalysisTable(view);
  await clickDrillButton(view, user, "Mistake queue");
  await clickDrillButton(view, user, "Practice this");

  return { user, view };
};

const chooseDrillDiscard = (
  view: DrillView,
  user: ReturnType<typeof userEvent.setup>,
) => clickIndices(view.getAllByRole, [0, 1], user);

const commitDrillChoice = async (
  view: DrillView,
  user: ReturnType<typeof userEvent.setup>,
) => {
  await chooseDrillDiscard(view, user);
  await clickDrillButton(view, user, "Check discard");
};

describe("trainer practice drill", () => {
  it("withholds the analysis until the drill choice is committed", async () => {
    const { user, view } = await openDrillFromQueue();

    expect(view.queryByRole("table")).toBeNull();

    await chooseDrillDiscard(view, user);

    /*
     * The only window in which withholding is the drill's doing: a complete
     * discard is on the board, so nothing but the choosing phase is keeping
     * the analysis off screen. Sampling before the two cards are picked
     * cannot distinguish a drill that withholds from an incomplete discard,
     * and passes against a Trainer that withholds nothing.
     */
    expect(view.queryByRole("table")).toBeNull();

    await clickDrillButton(view, user, "Check discard");

    await expect(findAnalysisTable(view)).resolves.toBeInTheDocument();
    expect(screen.getByLabelText("Practice drill")).toBeInTheDocument();
  });

  it("withholds live region status until the drill choice is committed", async () => {
    const { user, view } = await openDrillFromQueue();
    const liveRegion = view.getByRole("status");

    expect(liveRegion).toHaveTextContent("");

    await chooseDrillDiscard(view, user);

    expect(liveRegion).toHaveTextContent("");

    await clickDrillButton(view, user, "Check discard");
    await findAnalysisTable(view);

    expect(liveRegion).not.toHaveTextContent("");
  });

  it("records the re-attempt as practice without moving the lifetime tally", async () => {
    const { user, view } = await openDrillFromQueue();

    await commitDrillChoice(view, user);
    const tally = readTallyForDisplay();

    expect(tally.practice).toHaveLength(1);
    expect(tally.lifetime.decisions).toBe(1);
    /*
     * The whole of #809 in one line. The board shows a suit-relabeled
     * stand-in for the drilled mistake, so deriving the record key from the
     * cards on screen appended a second row under a key naming six cards
     * nobody was dealt; keying it by the hand being practiced lets
     * recordDiscardDecision's idempotency absorb the attempt instead.
     */
    expect(tally.records.map((record) => record.handKey)).toStrictEqual([
      `${MISTAKE_HAND}|Dealer`,
    ]);
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
    await expect(findAnalysisTable(view)).resolves.toBeInTheDocument();
  });
});
