import {
  CARD_RANKS,
  type Card,
  INDICES_PER_SUIT,
  type Rank,
  SUITS,
  SUITS_PER_DECK,
  type Suit,
} from "./Card";
import { CARDS_PER_DISCARD } from "./facts";
import { rankCounts } from "./rankCounts";

const ROLE_RANDOM_THRESHOLD = 0.5;
const DECK_SIZE = INDICES_PER_SUIT * SUITS_PER_DECK;

export const CribRole = {
  Dealer: "Dealer",
  Pone: "Pone",
} as const;

export type CribRole = (typeof CribRole)[keyof typeof CribRole];

export const randomCribRole = (generateRandomNumber: () => number): CribRole =>
  generateRandomNumber() < ROLE_RANDOM_THRESHOLD
    ? CribRole.Dealer
    : CribRole.Pone;

export type StarterRank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "T"
  | "J"
  | "Q"
  | "K";

type DiscardSuitGroup = "Suited" | "Unsuited";

export type ExpectedCribPointsDiscardKey =
  `${StarterRank}_${StarterRank}_${DiscardSuitGroup}`;

type StarterSuitRelation =
  | "matching_discard_suit"
  | "non_matching_discard_suit";

type ExpectedCribPointStatistics = Partial<
  Record<keyof ExpectedCribPointBreakdown | "total", ExpectedCribStatistic>
>;

interface ExpectedCribStatistic {
  readonly mu: number;
  readonly n: number;
  readonly points?: ExpectedCribPointStatistics;
  readonly se: number;
  readonly starter_suit_relation?: Partial<
    Record<StarterSuitRelation, ExpectedCribStatistic>
  >;
}

type ExpectedCribBucket = ExpectedCribStatistic | number;

type RoleBuckets = Record<CribRole, Record<StarterRank, ExpectedCribBucket>>;

export type ExpectedCribPointsTable = Record<
  ExpectedCribPointsDiscardKey,
  RoleBuckets
>;

interface ExpectedCribPointsOptions {
  readonly discard: readonly Card[];
  readonly knownCards: readonly Card[];
  readonly role: CribRole;
  readonly starterRank?: Rank | StarterRank;
  readonly table: ExpectedCribPointsTable;
}

export interface ExpectedCribPointBreakdown {
  readonly fifteens: number;
  readonly flushes: number;
  readonly nobs: number;
  readonly pairs: number;
  readonly runs: number;
}

export interface ExpectedCribStarterSuitRelationPoints {
  readonly expectedCribPoints: number;
  readonly pointBreakdown: ExpectedCribPointBreakdown | undefined;
  readonly relation: StarterSuitRelation;
  readonly remainingStarterCount: number;
  readonly starterRank: StarterRank;
  readonly suits: readonly Suit[];
}

export interface ExpectedCribStarterPoints {
  readonly expectedCribPoints: number;
  readonly pointBreakdown: ExpectedCribPointBreakdown | undefined;
  readonly remainingStarterCount: number;
  readonly starterSuitRelationPoints: readonly ExpectedCribStarterSuitRelationPoints[];
  readonly starterRank: StarterRank;
}

const missingPointBreakdown = new Map<string, ExpectedCribPointBreakdown>().get(
  "missing",
);
const missingSuit = new Map<string, Suit>().get("missing");
const missingWeightedPointValue = new Map<string, number>().get("missing");

interface PointBreakdownValues {
  readonly fifteens: number | undefined;
  readonly flushes: number | undefined;
  readonly nobs: number | undefined;
  readonly pairs: number | undefined;
  readonly runs: number | undefined;
}

export const STARTER_RANKS: readonly StarterRank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
];

const rankToStarterRank = (rank: Rank): StarterRank =>
  STARTER_RANKS.at(rank) as StarterRank;

const starterRankToRank = (starterRank: StarterRank): Rank =>
  STARTER_RANKS.indexOf(starterRank) as Rank;

const toStarterRank = (rank: Rank | StarterRank): StarterRank =>
  typeof rank === "number" ? rankToStarterRank(rank) : rank;

const getRoleBuckets = (
  table: ExpectedCribPointsTable,
  discardKey: ExpectedCribPointsDiscardKey,
  role: CribRole,
) => {
  const discardBuckets = Reflect.get(table, discardKey) as
    | RoleBuckets
    | undefined;
  if (!discardBuckets) {
    throw new Error(`Missing expected crib points for ${discardKey}`);
  }
  return role === CribRole.Dealer ? discardBuckets.Dealer : discardBuckets.Pone;
};

const getBucket = (
  buckets: Record<StarterRank, ExpectedCribBucket>,
  starterRank: StarterRank,
) => {
  const bucket = Reflect.get(buckets, starterRank) as
    | ExpectedCribBucket
    | undefined;
  if (typeof bucket !== "number" && typeof bucket !== "object") {
    throw new Error(`Missing expected crib points for starter ${starterRank}`);
  }
  return bucket;
};

const getBucketMu = (bucket: ExpectedCribBucket): number =>
  typeof bucket === "number" ? bucket : bucket.mu;

const getPointMu = (
  points: ExpectedCribPointStatistics,
  pointType: keyof ExpectedCribPointBreakdown,
): number | undefined => {
  const pointBucket = Reflect.get(points, pointType);
  return pointBucket?.mu;
};

const createPointBreakdown = ({
  fifteens,
  flushes,
  nobs,
  pairs,
  runs,
}: PointBreakdownValues): ExpectedCribPointBreakdown | undefined =>
  typeof fifteens === "number" &&
  typeof flushes === "number" &&
  typeof nobs === "number" &&
  typeof pairs === "number" &&
  typeof runs === "number"
    ? { fifteens, flushes, nobs, pairs, runs }
    : missingPointBreakdown;

const getPointBreakdown = (
  bucket: ExpectedCribBucket,
): ExpectedCribPointBreakdown | undefined => {
  if (typeof bucket === "number" || !bucket.points) {
    return missingPointBreakdown;
  }
  return createPointBreakdown({
    fifteens: getPointMu(bucket.points, "fifteens"),
    flushes: getPointMu(bucket.points, "flushes"),
    nobs: getPointMu(bucket.points, "nobs"),
    pairs: getPointMu(bucket.points, "pairs"),
    runs: getPointMu(bucket.points, "runs"),
  });
};

const sortDiscardByRank = (discard: readonly Card[]) =>
  [...discard].sort((left, right) => left.rank - right.rank) as [Card, Card];

export const normalizeDiscardKey = (
  discard: readonly Card[],
): ExpectedCribPointsDiscardKey => {
  if (discard.length !== CARDS_PER_DISCARD) {
    throw new Error("Expected exactly two discarded cards");
  }

  const [firstCard, secondCard] = sortDiscardByRank(discard);

  const suitGroup: DiscardSuitGroup =
    firstCard.rank !== secondCard.rank && firstCard.suit === secondCard.suit
      ? "Suited"
      : "Unsuited";

  return `${rankToStarterRank(firstCard.rank)}_${rankToStarterRank(
    secondCard.rank,
  )}_${suitGroup}`;
};

const getSuitedDifferentRankDiscardSuit = (
  discard: readonly Card[],
): Suit | undefined => {
  const [firstCard, secondCard] = sortDiscardByRank(discard);
  return firstCard.rank !== secondCard.rank &&
    firstCard.suit === secondCard.suit
    ? firstCard.suit
    : missingSuit;
};

const getExpectedCribBuckets = ({
  discard,
  role,
  table,
}: Pick<ExpectedCribPointsOptions, "discard" | "role" | "table">) =>
  getRoleBuckets(table, normalizeDiscardKey(discard), role);

const getRemainingStarterSuits = (
  knownCards: readonly Card[],
  starterRank: StarterRank,
): readonly Suit[] => {
  const rank = starterRankToRank(starterRank);
  const known = new Set(
    knownCards.filter((cd) => cd.rank === rank).map((cd) => cd.suit),
  );
  return SUITS.filter((st) => !known.has(st));
};

const getRelationSuits = (
  remainingSuits: readonly Suit[],
  relation: StarterSuitRelation,
  discardSuit: Suit,
) =>
  relation === "matching_discard_suit"
    ? remainingSuits.filter((suit) => suit === discardSuit)
    : remainingSuits.filter((suit) => suit !== discardSuit);

const getStarterSuitRelationPoints = ({
  bucket,
  discardSuit,
  remainingSuits,
  starterRank,
}: {
  readonly bucket: ExpectedCribBucket;
  readonly discardSuit: Suit | undefined;
  readonly remainingSuits: readonly Suit[];
  readonly starterRank: StarterRank;
}): readonly ExpectedCribStarterSuitRelationPoints[] => {
  if (
    typeof discardSuit !== "string" ||
    typeof bucket === "number" ||
    !bucket.starter_suit_relation
  ) {
    return [];
  }

  const relationPoints: ExpectedCribStarterSuitRelationPoints[] = [];
  for (const relation of [
    "matching_discard_suit",
    "non_matching_discard_suit",
  ] as const) {
    const relationBucket = Reflect.get(bucket.starter_suit_relation, relation);
    const suits = getRelationSuits(remainingSuits, relation, discardSuit);

    if (relationBucket && suits.length > 0) {
      relationPoints.push({
        expectedCribPoints: getBucketMu(relationBucket),
        pointBreakdown: getPointBreakdown(relationBucket),
        relation,
        remainingStarterCount: suits.length,
        starterRank,
        suits,
      });
    }
  }

  return relationPoints;
};

const getRelationWeight = (
  remainingStarterCount: number,
  starterSuitRelationPoints: readonly ExpectedCribStarterSuitRelationPoints[],
): number => {
  const weight = starterSuitRelationPoints.reduce(
    (sum, rel) => sum + rel.remainingStarterCount,
    0,
  );
  return starterSuitRelationPoints.length > 0 &&
    weight === remainingStarterCount
    ? weight
    : 0;
};

const getRelationWeightedExpectedCribPoints = ({
  expectedCribPoints,
  remainingStarterCount,
  starterSuitRelationPoints,
}: ExpectedCribStarterPoints): number => {
  const weight = getRelationWeight(
    remainingStarterCount,
    starterSuitRelationPoints,
  );
  if (weight === 0) {
    return expectedCribPoints;
  }

  return (
    starterSuitRelationPoints.reduce(
      (sum, rel) => sum + rel.expectedCribPoints * rel.remainingStarterCount,
      0,
    ) / weight
  );
};

const getRelationWeightedPointBreakdown = ({
  pointBreakdown,
  remainingStarterCount,
  starterSuitRelationPoints,
}: ExpectedCribStarterPoints): ExpectedCribPointBreakdown | undefined => {
  const weight = getRelationWeight(
    remainingStarterCount,
    starterSuitRelationPoints,
  );
  if (weight === 0) {
    return pointBreakdown;
  }

  if (starterSuitRelationPoints.some((rel) => !rel.pointBreakdown)) {
    return missingPointBreakdown;
  }

  const breakdown = { fifteens: 0, flushes: 0, nobs: 0, pairs: 0, runs: 0 };
  for (const rel of starterSuitRelationPoints) {
    const points = rel.pointBreakdown as ExpectedCribPointBreakdown;
    const relWeight = rel.remainingStarterCount;

    breakdown.fifteens += points.fifteens * relWeight;
    breakdown.flushes += points.flushes * relWeight;
    breakdown.nobs += points.nobs * relWeight;
    breakdown.pairs += points.pairs * relWeight;
    breakdown.runs += points.runs * relWeight;
  }

  return createPointBreakdown({
    fifteens: breakdown.fifteens / weight,
    flushes: breakdown.flushes / weight,
    nobs: breakdown.nobs / weight,
    pairs: breakdown.pairs / weight,
    runs: breakdown.runs / weight,
  });
};

export const expectedCribPointsByStarterRank = (
  opts: Omit<ExpectedCribPointsOptions, "starterRank">,
): ExpectedCribStarterPoints[] => {
  const buckets = getExpectedCribBuckets(opts);
  const counts = rankCounts(opts.knownCards);
  const discardSuit = getSuitedDifferentRankDiscardSuit(opts.discard);

  return CARD_RANKS.map((rank) => {
    const starterRank = rankToStarterRank(rank);
    const bucket = getBucket(buckets, starterRank);
    const remainingSuits = getRemainingStarterSuits(
      opts.knownCards,
      starterRank,
    );
    const starterSuitRelationPoints = getStarterSuitRelationPoints({
      bucket,
      discardSuit,
      remainingSuits,
      starterRank,
    });
    const starterPoints = {
      expectedCribPoints: getBucketMu(bucket),
      pointBreakdown: getPointBreakdown(bucket),
      remainingStarterCount: SUITS_PER_DECK - (counts.at(rank) as number),
      starterRank,
      starterSuitRelationPoints,
    };

    return {
      ...starterPoints,
      expectedCribPoints: getRelationWeightedExpectedCribPoints(starterPoints),
      pointBreakdown: getRelationWeightedPointBreakdown(starterPoints),
      starterRank,
    };
  });
};

const weightedPointValue = (
  starterPoints: readonly ExpectedCribStarterPoints[],
  totalKnownStarterWeight: number,
  getValue: (breakdown: ExpectedCribPointBreakdown) => number,
) => {
  let total = 0;

  for (const starterPoint of starterPoints) {
    if (starterPoint.remainingStarterCount > 0) {
      if (!starterPoint.pointBreakdown) {
        return missingWeightedPointValue;
      }

      total +=
        getValue(starterPoint.pointBreakdown) *
        starterPoint.remainingStarterCount;
    }
  }

  return total / totalKnownStarterWeight;
};

export const expectedCribPointBreakdown = (
  opts: Omit<ExpectedCribPointsOptions, "starterRank">,
): ExpectedCribPointBreakdown | undefined => {
  const totalWeight = DECK_SIZE - opts.knownCards.length;
  const starterPoints = expectedCribPointsByStarterRank(opts);
  const fifteens = weightedPointValue(
    starterPoints,
    totalWeight,
    (breakdown) => breakdown.fifteens,
  );
  const flushes = weightedPointValue(
    starterPoints,
    totalWeight,
    (breakdown) => breakdown.flushes,
  );
  const nobs = weightedPointValue(
    starterPoints,
    totalWeight,
    (breakdown) => breakdown.nobs,
  );
  const pairs = weightedPointValue(
    starterPoints,
    totalWeight,
    (breakdown) => breakdown.pairs,
  );
  const runs = weightedPointValue(
    starterPoints,
    totalWeight,
    (breakdown) => breakdown.runs,
  );

  return createPointBreakdown({ fifteens, flushes, nobs, pairs, runs });
};

export const expectedCribPoints = (opts: ExpectedCribPointsOptions): number => {
  if (typeof opts.starterRank !== "undefined") {
    const targetRank = toStarterRank(opts.starterRank);
    const points = expectedCribPointsByStarterRank(opts).find(
      (entry) => entry.starterRank === targetRank,
    );
    return (points as ExpectedCribStarterPoints).expectedCribPoints;
  }

  const totalKnownStarterWeight = DECK_SIZE - opts.knownCards.length;

  return (
    expectedCribPointsByStarterRank(opts).reduce(
      (sum, points) =>
        sum + points.expectedCribPoints * points.remainingStarterCount,
      0,
    ) / totalKnownStarterWeight
  );
};
