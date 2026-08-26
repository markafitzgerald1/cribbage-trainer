import type {
  DiscardDecisionPoint,
  DiscardPeriodBucket,
  DiscardTrendGranularity,
} from "../ui/discardQualityTrend";

export const SVG_WIDTH = 520;
export const SVG_HEIGHT = 200;
export const MARGIN_TOP = 20;
export const MARGIN_BOTTOM = 45;
export const MARGIN_LEFT = 45;
export const MARGIN_RIGHT = 25;
export const PLOT_WIDTH = SVG_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
export const PLOT_HEIGHT = SVG_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

export const MIN_MAX_LOSS = 1.0;
export const LOSS_STEP = 0.5;
export const MAX_TICK_INTERVALS = 5;
export const TICK_STEP_HALF = 0.5;
export const TICK_STEP_ONE = 1.0;
export const TICK_STEP_TWO = 2.0;
export const TICK_STEP_FIVE = 5.0;
export const TICK_STEP_TEN = 10.0;
export const TICK_STEP_TWENTY = 20.0;

export const CANDIDATE_TICK_STEPS = [
  TICK_STEP_HALF,
  TICK_STEP_ONE,
  TICK_STEP_TWO,
  TICK_STEP_FIVE,
  TICK_STEP_TEN,
  TICK_STEP_TWENTY,
] as const;

export const CHAR_WIDTH = 5.6;
export const LABEL_SAFETY_MARGIN = 8;
export const ENDPOINT_ANCHOR_THRESHOLD = 20;
export const HALF_DIVISOR = 2;
export const TICK_OFFSET_X = 6;
export const TICK_OFFSET_Y = 3.5;
export const X_LABEL_OFFSET_Y = 22;
export const DECIMAL_PLACES = 2;
export const TICK_LABEL_X = MARGIN_LEFT - TICK_OFFSET_X;
export const POINT_RADIUS = 4.5;
export const LAST_INDEX = -1;
export const ROLLING_WINDOW_20 = 20;
export const ROLLING_WINDOW_50 = 50;

export const OPTIMAL_POINT_COLOR = "#28a745";
export const DATA_POINT_COLOR = "#70c878";

export const getLossPointColor = (loss: number | null): string =>
  loss === 0 ? OPTIMAL_POINT_COLOR : DATA_POINT_COLOR;

export interface ChartPoint {
  readonly bucket: DiscardPeriodBucket;
  readonly color: string;
  readonly loss: number;
  readonly xPosition: number;
  readonly yPosition: number;
}

export interface ChartTick {
  readonly isOptimal: boolean;
  readonly label: string;
  readonly value: number;
  readonly yPosition: number;
}

export const calculateIndexedX = (index: number, total: number): number => {
  if (total === 1) {
    return MARGIN_LEFT + PLOT_WIDTH / HALF_DIVISOR;
  }
  return MARGIN_LEFT + (index / (total - 1)) * PLOT_WIDTH;
};

export const calculateCalendarX = (
  timestamp: number,
  buckets: readonly DiscardPeriodBucket[],
): number => {
  const [firstBucket] = buckets;
  const lastBucket = buckets.at(LAST_INDEX);

  if (
    !firstBucket ||
    !lastBucket ||
    firstBucket.startTime === lastBucket.startTime
  ) {
    return MARGIN_LEFT + PLOT_WIDTH / HALF_DIVISOR;
  }

  return (
    MARGIN_LEFT +
    ((timestamp - firstBucket.startTime) /
      (lastBucket.startTime - firstBucket.startTime)) *
      PLOT_WIDTH
  );
};

export interface CalculateXOptions {
  readonly bucket: DiscardPeriodBucket;
  readonly buckets: readonly DiscardPeriodBucket[];
  readonly granularity: DiscardTrendGranularity;
  readonly index: number;
}

export const calculateX = ({
  bucket,
  buckets,
  granularity,
  index,
}: CalculateXOptions): number =>
  granularity === "rolling20" || granularity === "rolling50"
    ? calculateIndexedX(index, buckets.length)
    : calculateCalendarX(bucket.startTime, buckets);

export const calculateY = (loss: number, maxLossY: number): number => {
  const clamped = Math.max(0, Math.min(loss, maxLossY));
  return MARGIN_TOP + PLOT_HEIGHT - (clamped / maxLossY) * PLOT_HEIGHT;
};

export const createChartPoints = (
  buckets: readonly DiscardPeriodBucket[],
  granularity: DiscardTrendGranularity,
  maxLossY: number,
): ChartPoint[] =>
  buckets.flatMap((bucket, index) => {
    if (bucket.meanExpectedPointsLoss === null) {
      return [];
    }
    return [
      {
        bucket,
        color: getLossPointColor(bucket.meanExpectedPointsLoss),
        loss: bucket.meanExpectedPointsLoss,
        xPosition: calculateX({ bucket, buckets, granularity, index }),
        yPosition: calculateY(bucket.meanExpectedPointsLoss, maxLossY),
      },
    ];
  });

export const formatPathData = (
  points: readonly {
    readonly xPosition: number;
    readonly yPosition: number;
  }[],
): string =>
  points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.xPosition.toFixed(1)},${point.yPosition.toFixed(1)}`;
    })
    .join(" ");

export const selectTickStep = (highestLoss: number): number => {
  const boundedLoss = Math.max(highestLoss, MIN_MAX_LOSS);
  for (const candidate of CANDIDATE_TICK_STEPS) {
    if (Math.ceil(boundedLoss / candidate) <= MAX_TICK_INTERVALS) {
      return candidate;
    }
  }
  return TICK_STEP_TWENTY;
};

export const calculateMaxLossY = (
  highestLoss: number,
  step: number,
): number => {
  const boundedLoss = Math.max(highestLoss, MIN_MAX_LOSS);
  return Math.ceil(boundedLoss / step) * step;
};

export const createChartTicks = (
  maxLossY: number,
  step: number,
): ChartTick[] => {
  const tickCount = Math.round(maxLossY / step);
  return Array.from({ length: tickCount + 1 }, (_, index) => {
    const value = index * step;
    return {
      isOptimal: value === 0,
      label: value === 0 ? "0.0 (Opt)" : value.toFixed(1),
      value,
      yPosition: calculateY(value, maxLossY),
    };
  });
};

export const createAdaptiveChartTicks = (
  highestLoss: number,
): { readonly maxLossY: number; readonly ticks: readonly ChartTick[] } => {
  const step = selectTickStep(highestLoss);
  const maxLossY = calculateMaxLossY(highestLoss, step);
  const ticks = createChartTicks(maxLossY, step);
  return { maxLossY, ticks };
};

export const formatShortLabel = (
  label: string,
  granularity: DiscardTrendGranularity,
): string => {
  if (granularity === "rolling20" || granularity === "rolling50") {
    return label
      .replace("Decisions ", "#")
      .replace("Retained decisions ", "Retained #")
      .replace("Skipped hands ", "Skipped #")
      .replace("Retained skipped hands ", "Retained skipped #");
  }
  return label;
};

export interface ChartXLabel {
  readonly anchor: "end" | "middle" | "start";
  readonly key: string;
  readonly label: string;
  readonly xPosition: number;
}

export interface PositionedLabel {
  readonly bucket: DiscardPeriodBucket;
  readonly label: string;
  readonly xPosition: number;
}

export const getLabelBounds = (
  label: string,
  xPosition: number,
  anchor: "end" | "middle" | "start",
): { readonly left: number; readonly right: number } => {
  const width = label.length * CHAR_WIDTH + LABEL_SAFETY_MARGIN;
  if (anchor === "start") {
    return { left: xPosition, right: xPosition + width };
  }
  if (anchor === "end") {
    return { left: xPosition - width, right: xPosition };
  }
  return {
    left: xPosition - width / HALF_DIVISOR,
    right: xPosition + width / HALF_DIVISOR,
  };
};

export const getXLabelAnchor = (
  xPosition: number,
  index: number,
  totalLabels: number,
): "end" | "middle" | "start" => {
  if (totalLabels <= 1) {
    return "middle";
  }
  if (index === 0 && xPosition <= MARGIN_LEFT + ENDPOINT_ANCHOR_THRESHOLD) {
    return "start";
  }
  if (
    index === totalLabels - 1 &&
    xPosition >= MARGIN_LEFT + PLOT_WIDTH - ENDPOINT_ANCHOR_THRESHOLD
  ) {
    return "end";
  }
  return "middle";
};

export const filterSpacedLabels = (
  positioned: readonly PositionedLabel[],
): PositionedLabel[] => {
  if (positioned.length <= 1) {
    return [...positioned];
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const first = positioned[0]!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const last = positioned.at(LAST_INDEX)!;

  const firstAnchor = getXLabelAnchor(first.xPosition, 0, positioned.length);
  const firstBounds = getLabelBounds(first.label, first.xPosition, firstAnchor);
  const lastAnchor = getXLabelAnchor(
    last.xPosition,
    positioned.length - 1,
    positioned.length,
  );
  const lastBounds = getLabelBounds(last.label, last.xPosition, lastAnchor);

  const chosen: PositionedLabel[] = [first];
  let lastChosenRight = firstBounds.right;

  for (let index = 1; index < positioned.length - 1; index += 1) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const candidate = positioned.at(index)!;
    const candidateBounds = getLabelBounds(
      candidate.label,
      candidate.xPosition,
      "middle",
    );
    if (
      candidateBounds.left >= lastChosenRight &&
      candidateBounds.right <= lastBounds.left
    ) {
      chosen.push(candidate);
      lastChosenRight = candidateBounds.right;
    }
  }

  if (lastBounds.left >= lastChosenRight) {
    chosen.push(last);
  }

  return chosen;
};

const mapPositionedToXLabels = (
  positioned: readonly PositionedLabel[],
): readonly ChartXLabel[] => {
  const filtered = filterSpacedLabels(positioned);
  const total = filtered.length;

  return filtered.map(({ bucket, label, xPosition }, index) => ({
    anchor: getXLabelAnchor(xPosition, index, total),
    key: bucket.key,
    label,
    xPosition,
  }));
};

export const createXAxisLabels = (
  buckets: readonly DiscardPeriodBucket[],
  granularity: DiscardTrendGranularity,
): readonly ChartXLabel[] => {
  const [single] = buckets;
  if (buckets.length === 1 && single) {
    return [
      {
        anchor: "middle",
        key: single.key,
        label: formatShortLabel(single.label, granularity),
        xPosition: calculateX({
          bucket: single,
          buckets,
          granularity,
          index: 0,
        }),
      },
    ];
  }

  const positioned: PositionedLabel[] = buckets.map((bucket, index) => ({
    bucket,
    label: formatShortLabel(bucket.label, granularity),
    xPosition: calculateX({ bucket, buckets, granularity, index }),
  }));

  return mapPositionedToXLabels(positioned);
};

export const createRollingXAxisLabels = (
  decisionPoints: readonly DiscardDecisionPoint[],
): readonly ChartXLabel[] => {
  const total = decisionPoints.length;
  const positioned: PositionedLabel[] = decisionPoints.map((point, index) => {
    const prefix = point.isRetained ? "R#" : "#";
    const label = `${prefix}${point.ordinal}`;
    return {
      bucket: {
        endTime: point.timestamp,
        key: `decision-${point.ordinal}`,
        label,
        startTime: point.timestamp,
      } as unknown as DiscardPeriodBucket,
      label,
      xPosition: calculateIndexedX(index, total),
    };
  });

  return mapPositionedToXLabels(positioned);
};

export const getLatestLoss = (points: readonly ChartPoint[]): string => {
  const lastPoint = points[points.length - 1];
  if (!lastPoint) {
    return "0.00";
  }
  return lastPoint.loss.toFixed(DECIMAL_PLACES);
};

export const getRollingWindowLabel = (
  total: number,
  granularity: DiscardTrendGranularity,
): string => {
  const targetWindow =
    granularity === "rolling50" ? ROLLING_WINDOW_50 : ROLLING_WINDOW_20;
  const actualWindow = Math.min(total, targetWindow);
  return `${actualWindow}-decision rolling average`;
};
