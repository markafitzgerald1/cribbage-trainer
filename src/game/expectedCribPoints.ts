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
}: PointBreakdownValues): ExpectedCribPointBreakdown | undefined => {
  if (
    typeof fifteens !== "number" ||
    typeof flushes !== "number" ||
    typeof nobs !== "number" ||
    typeof pairs !== "number" ||
    typeof runs !== "number"
  ) {
    return missingPointBreakdown;
  }

  return {
    fifteens,
    flushes,
    nobs,
    pairs,
    runs,
  };
};

const getPointBreakdown = (
  bucket: ExpectedCribBucket,
): ExpectedCribPointBreakdown | undefined => {
  if (typeof bucket === "number" || !bucket.points) {
    return missingPointBreakdown;
  }

  const fifteens = getPointMu(bucket.points, "fifteens");
  const flushes = getPointMu(bucket.points, "flushes");
  const nobs = getPointMu(bucket.points, "nobs");
  const pairs = getPointMu(bucket.points, "pairs");
  const runs = getPointMu(bucket.points, "runs");

  return createPointBreakdown({ fifteens, flushes, nobs, pairs, runs });
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

  if (
    firstCard.rank !== secondCard.rank &&
    firstCard.suit === secondCard.suit
  ) {
    return firstCard.suit;
  }

  return missingSuit;
};

const getExpectedCribBuckets = ({
  discard,
  role,
  table,
}: Pick<ExpectedCribPointsOptions, "discard" | "role" | "table">) => {
  const discardKey = normalizeDiscardKey(discard);

  return getRoleBuckets(table, discardKey, role);
};

const getRemainingStarterSuits = (
  knownCards: readonly Card[],
  starterRank: StarterRank,
): readonly Suit[] => {
  const rank = starterRankToRank(starterRank);
  const knownSuits = new Set(
    knownCards.filter((card) => card.rank === rank).map((card) => card.suit),
  );

  return SUITS.filter((suit) => !knownSuits.has(suit));
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
  ] as const satisfies readonly StarterSuitRelation[]) {
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

const getRelationWeightedExpectedCribPoints = ({
  expectedCribPoints,
  remainingStarterCount,
  starterSuitRelationPoints,
}: ExpectedCribStarterPoints): number => {
  const relationWeight = starterSuitRelationPoints.reduce(
    (sum, relationPoints) => sum + relationPoints.remainingStarterCount,
    0,
  );

  if (
    starterSuitRelationPoints.length === 0 ||
    relationWeight !== remainingStarterCount
  ) {
    return expectedCribPoints;
  }

  return (
    starterSuitRelationPoints.reduce(
      (sum, relationPoints) =>
        sum +
        relationPoints.expectedCribPoints *
          relationPoints.remainingStarterCount,
      0,
    ) / relationWeight
  );
};

export const expectedCribPointsByStarterRank = ({
  discard,
  knownCards,
  role,
  table,
}: Omit<
  ExpectedCribPointsOptions,
  "starterRank"
>): ExpectedCribStarterPoints[] => {
  const buckets = getExpectedCribBuckets({ discard, role, table });
  const counts = rankCounts(knownCards);
  const discardSuit = getSuitedDifferentRankDiscardSuit(discard);

  return CARD_RANKS.map((rank) => {
    const starterRank = rankToStarterRank(rank);
    const knownRankCount = counts.at(rank) as number;
    const bucket = getBucket(buckets, starterRank);
    const remainingSuits = getRemainingStarterSuits(knownCards, starterRank);
    const starterSuitRelationPoints = getStarterSuitRelationPoints({
      bucket,
      discardSuit,
      remainingSuits,
      starterRank,
    });
    const starterPoints = {
      expectedCribPoints: getBucketMu(bucket),
      pointBreakdown: getPointBreakdown(bucket),
      remainingStarterCount: SUITS_PER_DECK - knownRankCount,
      starterRank,
      starterSuitRelationPoints,
    };

    return {
      ...starterPoints,
      expectedCribPoints: getRelationWeightedExpectedCribPoints(starterPoints),
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

export const expectedCribPointBreakdown = ({
  discard,
  knownCards,
  role,
  table,
}: Omit<ExpectedCribPointsOptions, "starterRank">):
  | ExpectedCribPointBreakdown
  | undefined => {
  const totalKnownStarterWeight = DECK_SIZE - knownCards.length;
  const starterPoints = expectedCribPointsByStarterRank({
    discard,
    knownCards,
    role,
    table,
  });
  const fifteens = weightedPointValue(
    starterPoints,
    totalKnownStarterWeight,
    (breakdown) => breakdown.fifteens,
  );
  const flushes = weightedPointValue(
    starterPoints,
    totalKnownStarterWeight,
    (breakdown) => breakdown.flushes,
  );
  const nobs = weightedPointValue(
    starterPoints,
    totalKnownStarterWeight,
    (breakdown) => breakdown.nobs,
  );
  const pairs = weightedPointValue(
    starterPoints,
    totalKnownStarterWeight,
    (breakdown) => breakdown.pairs,
  );
  const runs = weightedPointValue(
    starterPoints,
    totalKnownStarterWeight,
    (breakdown) => breakdown.runs,
  );

  return createPointBreakdown({ fifteens, flushes, nobs, pairs, runs });
};

export const expectedCribPoints = ({
  discard,
  knownCards,
  role,
  starterRank,
  table,
}: ExpectedCribPointsOptions): number => {
  const buckets = getExpectedCribBuckets({ discard, role, table });

  if (typeof starterRank !== "undefined") {
    return getBucketMu(getBucket(buckets, toStarterRank(starterRank)));
  }

  const totalKnownStarterWeight = DECK_SIZE - knownCards.length;

  return (
    expectedCribPointsByStarterRank({
      discard,
      knownCards,
      role,
      table,
    }).reduce(
      (sum, starterPoints) =>
        sum +
        starterPoints.expectedCribPoints * starterPoints.remainingStarterCount,
      0,
    ) / totalKnownStarterWeight
  );
};
