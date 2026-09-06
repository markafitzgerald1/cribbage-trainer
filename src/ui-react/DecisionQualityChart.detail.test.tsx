import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import * as cardClasses from "./CardLabel.module.css";
import * as classes from "./DecisionQualityChart.module.css";
import {
  type RenderChart,
  makeBucket,
  makeDecisionPoint,
  makeRetainedDecisionPoint,
  renderChart,
} from "./DecisionQualityChart.test.common";
import { describe, expect, it } from "@jest/globals";
import { DecisionQualityChart } from "./DecisionQualityChart";
import type { DiscardDecisionPoint } from "../ui/discardQualityTrend";
import { fireEvent } from "@testing-library/react";

type ChartPoints = readonly DiscardDecisionPoint[];

const BUCKETS = [makeBucket("b1", 0.4)];

const OPTIMAL_THEN_LOSS: ChartPoints = [
  makeDecisionPoint(1, 0, 0),
  makeDecisionPoint(2, 0.45, 0.22),
];

const markerFor = (view: RenderChart, ordinal: number): Element =>
  view.container.querySelector(`[data-decision-ordinal="${ordinal}"]`)!;

const renderPlainChart = (): RenderChart =>
  renderChart(BUCKETS, "rolling20", OPTIMAL_THEN_LOSS);

const pressKeyOnLossMarker = (view: RenderChart, key: string): void => {
  fireEvent.keyDown(markerFor(view, 2), { key });
};

const withSecondPointPatched = (
  patch: Partial<DiscardDecisionPoint>,
): ChartPoints => [
  makeDecisionPoint(1, 0, 0),
  { ...makeDecisionPoint(2, 0.5, 0.25), ...patch },
];

const openDetailOn = (points: ChartPoints, ordinal: number): RenderChart => {
  const view = renderChart(BUCKETS, "rolling20", points);
  fireEvent.click(markerFor(view, ordinal));
  return view;
};

const cardLabelCount = (view: RenderChart): number =>
  view.container.querySelectorAll(`.${cardClasses.cardLabel}`).length;

const rerenderChart = (
  view: RenderChart,
  points: ChartPoints,
  granularity: Parameters<typeof renderChart>[1],
): void => {
  view.rerender(
    <DecisionQualityChart
      buckets={BUCKETS}
      decisionPoints={points}
      granularity={granularity}
    />,
  );
};

const expectPanelText = (view: RenderChart, text: string): void => {
  expect(view.getByRole("region")).toHaveTextContent(text);
};

const expectNoPanel = (view: RenderChart): void => {
  expect(view.queryByRole("region")).toBeNull();
};

describe("decision quality chart point detail", () => {
  it("opens a panel naming the clicked mistake with its hand and discard", () => {
    const view = openDetailOn(OPTIMAL_THEN_LOSS, 2);
    const panel = view.getByRole("region");

    expect(panel).toHaveTextContent("Decision #2");
    expect(panel).toHaveTextContent("0.45 lost");
    expect(panel).toHaveTextContent("Hand");
    expect(panel).toHaveTextContent("Discarded");
    expect(cardLabelCount(view)).toBe(8);
  });

  it("highlights only the selected loss marker", () => {
    const view = renderPlainChart();

    expect(
      view.container.querySelector(`.${classes.lossDotSelected}`),
    ).toBeNull();

    fireEvent.click(markerFor(view, 2));

    expect(
      view.container.querySelectorAll(`.${classes.lossDotSelected}`),
    ).toHaveLength(1);
  });

  it.each([{ key: "Enter" }, { key: " " }])(
    "opens the panel when $key activates a focused marker",
    ({ key }) => {
      const view = renderPlainChart();

      pressKeyOnLossMarker(view, key);

      expectPanelText(view, "Decision #2");
    },
  );

  it("ignores other keys pressed on a marker", () => {
    const view = renderPlainChart();

    pressKeyOnLossMarker(view, "a");

    expectNoPanel(view);
  });

  it("ignores activity that lands off every marker", () => {
    const view = renderPlainChart();

    fireEvent.click(
      view.getByRole("group", {
        name: "Decision quality over time trend chart",
      }),
    );

    expectNoPanel(view);
  });

  it.each([
    {
      close: (view: RenderChart): boolean =>
        fireEvent.click(markerFor(view, 2)),
      name: "the same marker is clicked again",
    },
    {
      close: (view: RenderChart): boolean =>
        fireEvent.click(view.getByRole("button", { name: "Close" })),
      name: "its Close button is pressed",
    },
    {
      close: (view: RenderChart): boolean =>
        fireEvent.keyDown(view.baseElement, { key: "Escape" }),
      name: "Escape is pressed",
    },
  ])("dismisses the panel when $name", ({ close }) => {
    const view = openDetailOn(OPTIMAL_THEN_LOSS, 2);

    close(view);

    expectNoPanel(view);
  });

  it("moves the panel to a different marker without closing", () => {
    const points: ChartPoints = [
      ...OPTIMAL_THEN_LOSS,
      makeDecisionPoint(3, 0.9, 0.4),
    ];
    const view = openDetailOn(points, 2);

    fireEvent.click(markerFor(view, 3));

    expectPanelText(view, "Decision #3");
  });

  it("keeps the panel open when the granularity changes under it", () => {
    const view = openDetailOn(OPTIMAL_THEN_LOSS, 2);

    rerenderChart(view, OPTIMAL_THEN_LOSS, "rolling50");

    expectPanelText(view, "Decision #2");
  });

  it("closes the panel when the selected decision leaves the view", () => {
    const view = openDetailOn(OPTIMAL_THEN_LOSS, 2);

    rerenderChart(view, [makeDecisionPoint(7, 0.6, 0.3)], "rolling20");

    expectNoPanel(view);
  });

  it("names the crib role for the decision", () => {
    expectPanelText(openDetailOn(OPTIMAL_THEN_LOSS, 2), "Dealer");
  });

  it("tiles the plot with one wide hit band per mistake, even when dense", () => {
    const dense = renderChart(
      BUCKETS,
      "rolling20",
      Array.from({ length: 60 }, (_, index) =>
        makeDecisionPoint(index + 1, 0.5, 0.5),
      ),
    );
    const bands = [
      ...dense.container.querySelectorAll(`.${classes.lossHitBand}`),
    ];
    const widths = bands.map((band) => Number(band.getAttribute("width")));

    expect(bands).toHaveLength(60);
    // An interior band spans point-to-point (~7.6 units), not a shrunk circle.
    expect(Number(bands[30]?.getAttribute("width"))).toBeGreaterThan(6);
    // The bands tile the plot: their widths sum to roughly its full span.
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeGreaterThan(400);
  });

  it("omits the discard row when no discard was recorded", () => {
    const view = openDetailOn(withSecondPointPatched({ discardKey: null }), 2);

    expectPanelText(view, "Hand");

    expect(view.queryByText("Discarded")).toBeNull();
  });

  it("shows no hand cards when the hand key cannot be parsed", () => {
    const view = openDetailOn(
      withSecondPointPatched({ handKey: "not-a-hand-key" }),
      2,
    );

    expect(view.getByRole("region")).toBeInTheDocument();
    expect(view.getByRole("region")).not.toHaveTextContent("Dealer");
    expect(cardLabelCount(view)).toBe(2);
  });

  it("labels a retained decision in the panel", () => {
    const points: ChartPoints = [
      makeRetainedDecisionPoint(1, 0, 0),
      makeRetainedDecisionPoint(2, 0.4, 0.2),
    ];
    const view = openDetailOn(points, 2);

    expectPanelText(view, "Retained decision #2");

    expect(view.getByRole("region")).toHaveTextContent("0.40 lost");
  });
});
