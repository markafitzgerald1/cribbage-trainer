import { CARDS, type Card, INDICES_PER_SUIT } from "./Card";
import { type HandPoints, handPoints } from "./handPoints";
import { CARDS_PER_DEALT_HAND } from "./facts";
import { rankCounts } from "./rankCounts";

export const SUITS_PER_DECK = 4;
export const POSSIBLE_STARTER_COUNT =
  INDICES_PER_SUIT * SUITS_PER_DECK - CARDS_PER_DEALT_HAND;

export const expectedHandPoints = (
  keep: readonly Card[],
  discard: readonly Card[],
): HandPoints => {
  const totalPoints: HandPoints = rankCounts([...keep, ...discard])
    .map((count: number, rank: number) => {
      // eslint-disable-next-line security/detect-object-injection
      const points = handPoints([...keep, CARDS[rank] as Card]);
      return {
        fifteens: points.fifteens * (SUITS_PER_DECK - count),
        pairs: points.pairs * (SUITS_PER_DECK - count),
        runs: points.runs * (SUITS_PER_DECK - count),
        total: points.total * (SUITS_PER_DECK - count),
      };
    })
    .reduce(
      (previous, current) => ({
        fifteens: previous.fifteens + current.fifteens,
        pairs: previous.pairs + current.pairs,
        runs: previous.runs + current.runs,
        total: previous.total + current.total,
      }),
      {
        fifteens: 0,
        pairs: 0,
        runs: 0,
        total: 0,
      },
    );

  const scaledTotalPoints: HandPoints = Object.fromEntries(
    Object.entries(totalPoints).map(([key, value]) => [
      key,
      value /
        (INDICES_PER_SUIT * SUITS_PER_DECK - keep.length - discard.length),
    ]),
  ) as unknown as HandPoints;

  return scaledTotalPoints;
};

export interface ExpectedCutAddedPoints {
  readonly fifteens: number;
  readonly pairs: number;
  readonly runs: number;
}

export interface CutBreakdownItem {
  readonly rankLabel: string;
  readonly count: number;
  readonly pointsPerCut: number;
}

export interface CutBreakdownCategory {
  readonly cuts: readonly CutBreakdownItem[];
  readonly totalCuts: number;
  readonly totalPoints: number;
}

export interface CutBreakdown {
  readonly fifteens: CutBreakdownCategory;
  readonly pairs: CutBreakdownCategory;
  readonly runs: CutBreakdownCategory;
}

const createCutBreakdownCategory = (): {
  cuts: CutBreakdownItem[];
  totalCuts: number;
  totalPoints: number;
} => ({
  cuts: [],
  totalCuts: 0,
  totalPoints: 0,
});

const addCutBreakdownItem = (
  category: { cuts: CutBreakdownItem[]; totalCuts: number; totalPoints: number },
  {
    count,
    pointsPerCut,
    rankLabel,
  }: { count: number; pointsPerCut: number; rankLabel: string },
) => {
  category.cuts.push({
    count,
    pointsPerCut,
    rankLabel,
  });
  category.totalCuts += count;
  category.totalPoints += pointsPerCut * count;
};

export const cutAddedPointsBreakdown = (
  keep: readonly Card[],
  discard: readonly Card[],
): CutBreakdown => {
  const basePoints = handPoints(keep);
  const fifteens = createCutBreakdownCategory();
  const pairs = createCutBreakdownCategory();
  const runs = createCutBreakdownCategory();

  rankCounts([...keep, ...discard]).forEach((count: number, rank: number) => {
    const remaining = SUITS_PER_DECK - count;
    if (remaining <= 0) {
      return;
    }
    // eslint-disable-next-line security/detect-object-injection
    const cutCard = CARDS[rank] as Card;
    const points = handPoints([...keep, cutCard]);
    const fifteensDelta = points.fifteens - basePoints.fifteens;
    const pairsDelta = points.pairs - basePoints.pairs;
    const runsDelta = points.runs - basePoints.runs;

    if (fifteensDelta > 0) {
      addCutBreakdownItem(fifteens, {
        count: remaining,
        pointsPerCut: fifteensDelta,
        rankLabel: cutCard.rankLabel,
      });
    }

    if (pairsDelta > 0) {
      addCutBreakdownItem(pairs, {
        count: remaining,
        pointsPerCut: pairsDelta,
        rankLabel: cutCard.rankLabel,
      });
    }

    if (runsDelta > 0) {
      addCutBreakdownItem(runs, {
        count: remaining,
        pointsPerCut: runsDelta,
        rankLabel: cutCard.rankLabel,
      });
    }
  });

  return {
    fifteens,
    pairs,
    runs,
  };
};

export const expectedCutAddedPoints = (
  keep: readonly Card[],
  discard: readonly Card[],
): ExpectedCutAddedPoints => {
  const basePoints = handPoints(keep);
  const summedPoints = rankCounts([...keep, ...discard])
    .map((count: number, rank: number) => {
      const remaining = SUITS_PER_DECK - count;
      if (remaining <= 0) {
        return {
          fifteens: 0,
          pairs: 0,
          runs: 0,
          weight: 0,
        };
      }
      // eslint-disable-next-line security/detect-object-injection
      const points = handPoints([...keep, CARDS[rank] as Card]);
      return {
        fifteens: (points.fifteens - basePoints.fifteens) * remaining,
        pairs: (points.pairs - basePoints.pairs) * remaining,
        runs: (points.runs - basePoints.runs) * remaining,
        weight: remaining,
      };
    })
    .reduce(
      (previous, current) => ({
        fifteens: previous.fifteens + current.fifteens,
        pairs: previous.pairs + current.pairs,
        runs: previous.runs + current.runs,
        weight: previous.weight + current.weight,
      }),
      {
        fifteens: 0,
        pairs: 0,
        runs: 0,
        weight: 0,
      },
    );

  if (summedPoints.weight === 0) {
    return {
      fifteens: 0,
      pairs: 0,
      runs: 0,
    };
  }

  return {
    fifteens: summedPoints.fifteens / summedPoints.weight,
    pairs: summedPoints.pairs / summedPoints.weight,
    runs: summedPoints.runs / summedPoints.weight,
  };
};
