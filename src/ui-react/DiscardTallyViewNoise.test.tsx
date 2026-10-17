/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import {
  RECORDED_MISTAKE,
  RECORDED_OPTIMAL,
  RECORDED_WITHIN_NOISE,
  seedRecordedTally,
} from "./discardTallyNoise.test.common";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, within } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import type { DiscardDecisionRecord } from "../ui/discardTally";
import { DiscardTallyView } from "./DiscardTallyView";
import { ONE_DAY_MS } from "../ui/mistakeQueue.test.common";
/* jscpd:ignore-end */

// Period, Decisions, Avg recorded loss, Best choice, Skipped.
const OPTIMAL_COLUMN = 3;

const renderTally = (records: readonly DiscardDecisionRecord[]) =>
  render(<DiscardTallyView summary={seedRecordedTally(records)} />);

type View = ReturnType<typeof renderTally>;

const ALL_THREE = [RECORDED_OPTIMAL, RECORDED_WITHIN_NOISE, RECORDED_MISTAKE];

const queueButton = (view: View) =>
  view.queryByRole("button", { name: "Mistake queue" });

const openTrend = (view: View) => {
  fireEvent.click(view.getByRole("button", { name: "Quality trend" }));
  return view.getByRole("region", { name: "Decision quality over time" });
};

// The first match is the summary card; the breakdown table's header repeats the label.
const summaryCardValue = (region: HTMLElement, label: string) =>
  within(region).getAllByText(label)[0]?.nextElementSibling?.textContent ??
  null;

// Spelled out rather than spread, since a record stored before #894 has no admission field at all.
const UNRECORDED_ADMISSION: DiscardDecisionRecord = {
  at: RECORDED_WITHIN_NOISE.at,
  cribRole: RECORDED_WITHIN_NOISE.cribRole,
  discardKey: RECORDED_WITHIN_NOISE.discardKey,
  expectedPointsLoss: RECORDED_WITHIN_NOISE.expectedPointsLoss,
  handKey: RECORDED_WITHIN_NOISE.handKey,
  isOptimal: false,
  isPractice: false,
  tableIdentity: null,
};

/*
 * Two real hands whose verdict under the installed tables is the opposite of
 * the one recorded: the pone A-2 of clubs from A-6 loses 0.06, inside its
 * noise threshold today, and the dealer pair of kings loses 0.09, just above
 * its own. History keeps what was recorded (#894), so each case fails if the
 * tally re-judges a stored hand and discard with the current tables.
 */
const RECORDED_MISTAKE_NOW_NOISE: DiscardDecisionRecord = {
  ...RECORDED_MISTAKE,
  cribRole: CribRole.Pone,
  discardKey: "AC,2C",
  expectedPointsLoss: 0.055_813,
  handKey: "AC,2C,3C,4C,5C,6C|Pone",
};
const RECORDED_NOISE_NOW_MISTAKE: DiscardDecisionRecord = {
  ...RECORDED_WITHIN_NOISE,
  discardKey: "KH,KC",
  expectedPointsLoss: 0.0856,
  handKey: "KC,8C,6H,5D,4H,KH|Dealer",
};

describe("noise-aware tally, queue and trend, as recorded (#774)", () => {
  it("takes a decision recorded as within noise out of both sides of Best choice", () => {
    const view = renderTally(ALL_THREE);

    expect(view.getAllByText("1/2")).toHaveLength(2);
  });

  // Two days back, so no daylight-saving day can fold them into today.
  it("takes only today's within-noise decisions out of today's count", () => {
    const earlier = Date.now() - 2 * ONE_DAY_MS;
    const view = renderTally([
      { ...RECORDED_OPTIMAL, at: earlier },
      { ...RECORDED_NOISE_NOW_MISTAKE, at: earlier },
      RECORDED_WITHIN_NOISE,
      RECORDED_MISTAKE,
    ]);

    expect(view.getByText("0/1")).toBeInTheDocument();
    expect(view.getByText("1/2")).toBeInTheDocument();
  });

  it.each([
    {
      name: "a pending decision",
      record: { ...RECORDED_WITHIN_NOISE, recordedAdmission: "pending" },
    },
    {
      name: "a decision with no recorded admission",
      record: UNRECORDED_ADMISSION,
    },
  ])("keeps $name in the exact Best choice", ({ record }) => {
    const view = renderTally([
      RECORDED_OPTIMAL,
      record as DiscardDecisionRecord,
    ]);

    expect(view.getAllByText("1/2")).toHaveLength(2);
    expect(queueButton(view)).toBeInTheDocument();
  });

  it("hides the Mistake queue button when every mistake is recorded as within noise", () => {
    const view = renderTally([RECORDED_OPTIMAL, RECORDED_WITHIN_NOISE]);

    expect(queueButton(view)).toBeNull();
    expect(view.getAllByText("1/1")).toHaveLength(2);
  });

  it.each([
    {
      bestChoice: "1/2",
      name: "a recorded mistake that today's tables would call noise",
      queued: true,
      record: RECORDED_MISTAKE_NOW_NOISE,
    },
    {
      bestChoice: "1/1",
      name: "a recorded within-noise decision that today's tables would call a mistake",
      queued: false,
      record: RECORDED_NOISE_NOW_MISTAKE,
    },
  ])("keeps $name as recorded", ({ bestChoice, queued, record }) => {
    const view = renderTally([RECORDED_OPTIMAL, record]);

    expect(view.getAllByText(bestChoice)).toHaveLength(2);
    expect(queueButton(view) !== null).toBe(queued);
  });

  it("marks a within-noise point neutral and leaves it out of the rolling Best choice", () => {
    const dialog = openTrend(renderTally(ALL_THREE));

    expect(summaryCardValue(dialog, "Best choice")).toBe("50.0%");
    expect(
      within(dialog).getByRole("button", {
        name: "Decision #2, recorded cost 0.04 points, within simulation noise. Select to see the hand.",
      }),
    ).toBeInTheDocument();
  });

  it("leaves a within-noise decision out of each calendar period's Best choice share", () => {
    const dialog = openTrend(renderTally(ALL_THREE));
    fireEvent.click(within(dialog).getByRole("radio", { name: "Day" }));

    const optimalCell = within(dialog).getByRole("cell", { name: "Today" })
      .parentElement?.children[OPTIMAL_COLUMN];

    expect(optimalCell).toHaveTextContent("50.0%");
  });
});
