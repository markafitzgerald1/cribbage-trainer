import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import * as cardClasses from "./CardLabel.module.css";
import * as classes from "./DecisionQualityChart.module.css";
import {
  DecisionQualityChart,
  type PracticeDecisionHandler,
} from "./DecisionQualityChart";
import {
  type RenderChart,
  makeBucket,
  makeDecisionPoint,
  makeMasteredDecisionPoint,
  makeRetainedDecisionPoint,
  renderChart,
} from "./DecisionQualityChart.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import type { DiscardDecisionPoint } from "../ui/discardQualityTrend";
import { SortOrder } from "../ui/SortOrder";

type ChartPoints = readonly DiscardDecisionPoint[];

const BUCKETS = [makeBucket("b1", 0.4)];

const OPTIMAL_THEN_LOSS: ChartPoints = [
  makeDecisionPoint(1, 0, 0),
  makeDecisionPoint(2, 0.45, 0.22),
];

const MASTERED_THEN_LOSS: ChartPoints = [
  makeMasteredDecisionPoint(1, 0.6, 0.3),
  makeDecisionPoint(2, 0.45, 0.22),
];

const renderWith = ({
  onPracticeDecision = null,
  sortOrder = SortOrder.DealOrder,
}: {
  readonly onPracticeDecision?: PracticeDecisionHandler;
  readonly sortOrder?: SortOrder;
}): RenderChart =>
  render(
    <DecisionQualityChart
      buckets={BUCKETS}
      decisionPoints={OPTIMAL_THEN_LOSS}
      granularity="rolling20"
      onPracticeDecision={onPracticeDecision}
      sortOrder={sortOrder}
    />,
  );

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

  it("forgets a selection when its decision leaves the view", () => {
    const view = openDetailOn(OPTIMAL_THEN_LOSS, 2);

    rerenderChart(view, [makeDecisionPoint(7, 0.6, 0.3)], "rolling20");
    expectNoPanel(view);

    // Restoring the filter must not resurrect the panel.
    rerenderChart(view, OPTIMAL_THEN_LOSS, "rolling20");
    expectNoPanel(view);
  });

  it("gives an optimal decision no hit band, only the mistakes around it", () => {
    const points: ChartPoints = [
      makeDecisionPoint(1, 0.8, 0.4),
      makeDecisionPoint(2, 0, 0),
      makeDecisionPoint(3, 0.5, 0.3),
    ];
    const view = renderChart(BUCKETS, "rolling20", points);
    const bandOrdinals = [
      ...view.container.querySelectorAll(`.${classes.lossHitBand}`),
    ].map((band) => band.getAttribute("data-decision-ordinal"));

    expect(bandOrdinals).toStrictEqual(["1", "3"]);
  });

  it("names the crib role for the decision", () => {
    expectPanelText(openDetailOn(OPTIMAL_THEN_LOSS, 2), "Dealer");
  });

  it("paints the hit bands above the trend line and latest-average dot", () => {
    const view = renderChart(BUCKETS, "rolling20", [
      makeDecisionPoint(1, 0.6, 0.6),
    ]);
    const svg = view.getByRole("group", {
      name: "Decision quality over time trend chart",
    });
    const order = [...svg.querySelectorAll("*")];
    const band = view.container.querySelector(`.${classes.lossHitBand}`);
    const latestDot = view.container.querySelector(`.${classes.dataPoint}`);

    expect(order.indexOf(band as Element)).toBeGreaterThan(
      order.indexOf(latestDot as Element),
    );
    expect(band?.querySelector("title")).toHaveTextContent("Decision #1");

    fireEvent.click(band as Element);

    expectPanelText(view, "Decision #1");
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

  it("offers a practice button that forwards the tapped decision", () => {
    const onPracticeDecision = jest.fn<(point: DiscardDecisionPoint) => void>();
    const view = renderWith({ onPracticeDecision });

    fireEvent.click(markerFor(view, 2));
    fireEvent.click(view.getByRole("button", { name: "Practice this hand" }));

    expect(onPracticeDecision).toHaveBeenCalledWith(
      expect.objectContaining({ ordinal: 2 }),
    );
  });

  it("hides the practice button without an onPracticeDecision handler", () => {
    const view = openDetailOn(OPTIMAL_THEN_LOSS, 2);

    expect(
      view.queryByRole("button", { name: "Practice this hand" }),
    ).not.toBeInTheDocument();
  });

  it("renders the detail cards in the given sort order", () => {
    const view = renderWith({ sortOrder: SortOrder.Descending });

    fireEvent.click(markerFor(view, 2));
    const firstHandRank = view.container.querySelector(
      `.${classes.decisionDetailCards} .${cardClasses.rank}`,
    );

    expect(firstHandRank).toHaveTextContent("10");
  });

  it("sets a mastered mistake apart in its marker, label, and panel", () => {
    const view = openDetailOn(MASTERED_THEN_LOSS, 1);
    const openDot = view.container.querySelector(
      `[data-decision-ordinal="2"] .${classes.lossDot}`,
    );

    expect(
      view.container.querySelector(`.${classes.lossDotMastered}`),
    ).toBeInTheDocument();
    expect(openDot).not.toHaveClass(classes.lossDotMastered);
    expect(markerFor(view, 1)).toHaveAttribute(
      "aria-label",
      expect.stringContaining("mastered since"),
    );
    expect(view.getByRole("region")).toHaveTextContent("Mastered");
  });
});
