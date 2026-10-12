/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import {
  type TableIdentity,
  shippedTableIdentity,
} from "../game/tableIdentity";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import {
  makeBucket,
  makeDecisionPoint,
  renderChart,
} from "./DecisionQualityChart.test.common";
import { CribRole } from "../game/expectedCribPoints";
import { DecisionQualityChart } from "./DecisionQualityChart";
import { DecisionQualityTrendDialog } from "./DecisionQualityTrendDialog";
import { DiscardTallyView } from "./DiscardTallyView";
import type { RecordedAdmission } from "../ui/recordedAdmission";
import type { StoredTally } from "../ui/discardTally";
import { discardTallySummary } from "./discardTally.test.common";
import { originalIdentity } from "./PracticeDrillPanel.test.common";
import { practiceReadyDialogTally } from "./DecisionQualityTrendDialog.test.common";
/* jscpd:ignore-end */

const openSmallCost = (identity: TableIdentity | null = null) => {
  const point = {
    ...makeDecisionPoint(1, 0.004, 0.004),
    tableIdentity: identity,
  };
  const view = renderChart([makeBucket("small", 0.004)], "rolling20", [point]);
  fireEvent.click(
    view.getByRole("button", { name: /Select to see the hand/u }),
  );
  return view;
};

const openPracticeDetail = (tally: StoredTally, index = 0) => {
  const view = render(
    <DecisionQualityTrendDialog
      onClose={jest.fn()}
      onStartDrill={jest.fn()}
      show
      tally={tally}
    />,
  );
  fireEvent.click(
    view.getAllByRole("button", { name: /Select to see the hand/u })[index]!,
  );
  return view;
};

const practiceIsOffered = (view: ReturnType<typeof render>) =>
  view.queryByRole("button", { name: "Practice this hand" }) !== null;

describe("recorded history presentation", () => {
  it("announces sub-cent marker, detail and rolling mean as recorded costs", () => {
    const view = openSmallCost();

    expect(
      view.getByRole("button", {
        name: "Decision #1: Recorded cost: less than 0.01 points. Select to see the hand.",
      }),
    ).toBeInTheDocument();
    expect(
      view.getByRole("note", { name: "Recorded cost: less than 0.01 points" }),
    ).toHaveTextContent("Recorded cost: < 0.01 points");
    expect(view.getByRole("group")).toHaveAccessibleDescription(
      "Trend chart with 1 decisions (1-decision rolling average). Latest recorded loss is less than 0.01 points per discard.",
    );
  });

  it("labels tally averages and explains the table-change boundary", () => {
    const view = render(
      <DiscardTallyView
        summary={discardTallySummary({
          meanExpectedPointsLoss: 0.004,
          todayDecisions: 1,
          todayMeanExpectedPointsLoss: 0.004,
        })}
      />,
    );

    expect(
      view.getAllByRole("note", {
        name: "Recorded loss: less than 0.01 points per discard",
      }),
    ).toHaveLength(2);

    fireEvent.click(view.getByText("As recorded"));

    expect(
      view.getByText(/Earlier results, queue membership and mastery are kept/u),
    ).toBeInTheDocument();
  });

  it("does not offer an inert practice action for a non-admitted point", () => {
    const tally = practiceReadyDialogTally();

    expect(tally.records[2]?.cribRole).toBe(CribRole.Dealer);

    const view = openPracticeDetail(tally, 2);

    expect(
      view.getByRole("region", { name: "Decision #3 detail" }),
    ).toBeInTheDocument();
    expect(practiceIsOffered(view)).toBe(false);
  });
});

describe("recorded chart provenance", () => {
  it.each([
    { identity: null, label: "Original tables unknown" },
    { identity: originalIdentity, label: "Judged with different tables" },
    { identity: shippedTableIdentity, label: "Judged with current tables" },
  ])("carries $label from the original point", ({ identity, label }) => {
    const view = openSmallCost(identity);

    expect(
      view.getByRole("region", { name: "Decision #1 detail" }),
    ).toHaveTextContent(label);
    expect(
      view.getByRole("note", { name: "Recorded cost: less than 0.01 points" }),
    ).toHaveTextContent("< 0.01");
  });

  it("announces a sub-cent calendar mean without calling it zero", () => {
    const view = render(
      <DecisionQualityChart
        buckets={[makeBucket("calendar", 0.004)]}
        granularity="day"
      />,
    );

    expect(view.getByRole("group")).toHaveAccessibleDescription(
      "Trend chart with 1 periods. Latest recorded loss is less than 0.01 points per discard.",
    );
    expect(
      view.getByText(
        "Period calendar: less than 0.01 points recorded loss per discard (10 decisions, 5 best choices then, 1 skipped)",
      ),
    ).toBeInTheDocument();
  });
});

const ADMISSION_CASES: { admission: RecordedAdmission; offered: boolean }[] = [
  { admission: "pending", offered: false },
  {
    admission: { basis: "sampling-noise-v1", eligible: false },
    offered: false,
  },
  { admission: { basis: "exact-fallback-v1", eligible: true }, offered: true },
];

describe("captured chart practice admission", () => {
  it.each(ADMISSION_CASES)(
    "uses captured admission $admission for historical mastery and practice",
    ({ admission, offered }) => {
      const original = practiceReadyDialogTally();
      const record = original.records[0]!;
      const tally = {
        ...original,
        practice: [
          {
            attempts: 2,
            consecutiveSuccesses: 2,
            handKey: record.handKey,
            lastAttemptAt: record.at + 2,
            recencyAt: record.at + 2,
            totalWrongLoss: 0,
            wrong: 0,
          },
        ],
        records: [{ ...record, recordedAdmission: admission }],
      };
      const view = openPracticeDetail(tally);

      expect(
        view.getByRole("note", { name: "Recorded cost: 1.40 points" }),
      ).toBeInTheDocument();
      expect(practiceIsOffered(view)).toBe(offered);
      expect(
        view.queryByText("Mastered — mastery kept from earlier retries") !==
          null,
      ).toBe(offered);
    },
  );
});
