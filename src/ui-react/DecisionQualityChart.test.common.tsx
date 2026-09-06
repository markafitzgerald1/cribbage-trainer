import type {
  DiscardDecisionPoint,
  DiscardPeriodBucket,
  DiscardTrendGranularity,
} from "../ui/discardQualityTrend";
import { DecisionQualityChart } from "./DecisionQualityChart";
import { render } from "@testing-library/react";

export const makeBucket = (
  key: string,
  loss: number | null,
  decisions = 10,
): DiscardPeriodBucket => ({
  decisions,
  endTime: 1700003600000,
  key,
  label: `Period ${key}`,
  meanExpectedPointsLoss: loss,
  optimalDecisions: 5,
  skippedHands: 1,
  startTime: 1700000000000,
});

export const renderChart = (
  buckets: readonly DiscardPeriodBucket[],
  granularity: DiscardTrendGranularity,
  decisionPoints?: readonly DiscardDecisionPoint[],
) =>
  render(
    <DecisionQualityChart
      buckets={buckets}
      decisionPoints={decisionPoints}
      granularity={granularity}
    />,
  );

export type RenderChart = ReturnType<typeof renderChart>;

export const HAND_KEY = "5H,6H,7H,8H,9H,10H|Dealer";
export const DISCARD_KEY = "5H,6H";

export const makeDecisionPoint = (
  ordinal: number,
  expectedPointsLoss: number,
  rollingMeanLoss: number,
) => ({
  discardKey: DISCARD_KEY,
  expectedPointsLoss,
  handKey: HAND_KEY,
  isOptimal: expectedPointsLoss === 0,
  isRetained: false,
  ordinal,
  recencyAt: 1_700_000_500_000 + ordinal,
  rollingMeanLoss,
  timestamp: 1700000000000 + ordinal * 1000,
});

export const makeRetainedDecisionPoint = (
  ordinal: number,
  expectedPointsLoss: number,
  rollingMeanLoss: number,
) => ({
  ...makeDecisionPoint(ordinal, expectedPointsLoss, rollingMeanLoss),
  isRetained: true,
});
