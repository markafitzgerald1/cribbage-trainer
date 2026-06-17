import {
  CARD_RANKS,
  type Card,
  INDICES_PER_SUIT,
  type Rank,
  type RankedCard,
  SUITS_PER_DECK,
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

type RoleBuckets = Record<CribRole, Record<StarterRank, number>>;

export type ExpectedCribPointsTable = Record<
  ExpectedCribPointsDiscardKey,
  RoleBuckets
>;

interface ExpectedCribPointsOptions {
  readonly discard: readonly Card[];
  readonly knownCards: readonly RankedCard[];
  readonly role: CribRole;
  readonly starterRank?: Rank | StarterRank;
  readonly table: ExpectedCribPointsTable;
}

export interface ExpectedCribStarterPoints {
  readonly expectedCribPoints: number;
  readonly remainingStarterCount: number;
  readonly starterRank: StarterRank;
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

const getBucketValue = (
  buckets: Record<StarterRank, number>,
  starterRank: StarterRank,
) => {
  const value = Reflect.get(buckets, starterRank) as number | undefined;

  if (typeof value === "undefined") {
    throw new Error(`Missing expected crib points for starter ${starterRank}`);
  }

  return value;
};

export const normalizeDiscardKey = (
  discard: readonly Card[],
): ExpectedCribPointsDiscardKey => {
  if (discard.length !== CARDS_PER_DISCARD) {
    throw new Error("Expected exactly two discarded cards");
  }

  const [firstCard, secondCard] = [...discard].sort(
    (left, right) => left.rank - right.rank,
  ) as [Card, Card];

  const suitGroup: DiscardSuitGroup =
    firstCard.rank !== secondCard.rank && firstCard.suit === secondCard.suit
      ? "Suited"
      : "Unsuited";

  return `${rankToStarterRank(firstCard.rank)}_${rankToStarterRank(
    secondCard.rank,
  )}_${suitGroup}`;
};

const getExpectedCribBuckets = ({
  discard,
  role,
  table,
}: Pick<ExpectedCribPointsOptions, "discard" | "role" | "table">) => {
  const discardKey = normalizeDiscardKey(discard);

  return getRoleBuckets(table, discardKey, role);
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

  return CARD_RANKS.map((rank) => {
    const starterRank = rankToStarterRank(rank);
    const knownRankCount = counts.at(rank) as number;

    return {
      expectedCribPoints: getBucketValue(buckets, starterRank),
      remainingStarterCount: SUITS_PER_DECK - knownRankCount,
      starterRank,
    };
  });
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
    return getBucketValue(buckets, toStarterRank(starterRank));
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
