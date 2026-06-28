import {
  CribRole,
  STARTER_RANKS,
  type StarterRank,
} from "./expectedCribPoints";
import { CARDS_PER_KEPT_HAND } from "./facts";
import { type Card } from "./Card";

export type ExpectedPlayPointsHandKey =
  `${StarterRank}_${StarterRank}_${StarterRank}_${StarterRank}`;

export type ExpectedPlayPointType =
  | "fifteen"
  | "thirty_one"
  | "pair"
  | "run"
  | "go"
  | "last_card";

export interface ExpectedPlayStatistic {
  readonly mu: number;
}

export interface ExpectedPlayPlayerBucket extends ExpectedPlayStatistic {
  readonly points: Readonly<
    Record<ExpectedPlayPointType, ExpectedPlayStatistic>
  >;
}

export interface ExpectedPlayRoleBucket extends ExpectedPlayStatistic {
  readonly players: Readonly<Record<CribRole, ExpectedPlayPlayerBucket>>;
}

export type ExpectedPlayHandBucket = Readonly<
  Record<CribRole, ExpectedPlayRoleBucket>
>;

export type ExpectedPlayPointsTable = Readonly<
  Record<ExpectedPlayPointsHandKey, ExpectedPlayHandBucket>
>;

export interface ExpectedPlayPointBreakdown {
  readonly fifteens: number;
  readonly thirtyOnes: number;
  readonly pairs: number;
  readonly runs: number;
  readonly go: number;
  readonly lastCard: number;
}

export interface ExpectedPlayPlayerBreakdown {
  readonly pointBreakdown: ExpectedPlayPointBreakdown;
  readonly total: number;
}

export interface ExpectedPlayPoints {
  readonly dealer: ExpectedPlayPlayerBreakdown;
  readonly delta: number;
  readonly pone: ExpectedPlayPlayerBreakdown;
}

const COMPONENT_TOLERANCE = 0.001;

export const normalizePlayHandKey = (
  keep: readonly Card[],
): ExpectedPlayPointsHandKey => {
  if (keep.length !== CARDS_PER_KEPT_HAND) {
    throw new Error("Expected exactly four kept cards");
  }

  return [...keep]
    .sort((left, right) => left.rank - right.rank)
    .map((card) => STARTER_RANKS.at(card.rank))
    .join("_") as ExpectedPlayPointsHandKey;
};

const toPointBreakdown = (
  bucket: ExpectedPlayPlayerBucket,
): ExpectedPlayPointBreakdown => ({
  fifteens: bucket.points.fifteen.mu,
  go: bucket.points.go.mu,
  lastCard: bucket.points.last_card.mu,
  pairs: bucket.points.pair.mu,
  runs: bucket.points.run.mu,
  thirtyOnes: bucket.points.thirty_one.mu,
});

const toPlayerBreakdown = (
  bucket: ExpectedPlayPlayerBucket,
): ExpectedPlayPlayerBreakdown => {
  const pointBreakdown = toPointBreakdown(bucket);
  const componentTotal =
    pointBreakdown.fifteens +
    pointBreakdown.thirtyOnes +
    pointBreakdown.pairs +
    pointBreakdown.runs +
    pointBreakdown.go +
    pointBreakdown.lastCard;
  if (Math.abs(componentTotal - bucket.mu) > COMPONENT_TOLERANCE) {
    throw new Error("Expected play point breakdown does not sum to total");
  }
  return { pointBreakdown, total: bucket.mu };
};

export const expectedPlayPoints = ({
  keep,
  role,
  table,
}: {
  readonly keep: readonly Card[];
  readonly role: CribRole;
  readonly table: ExpectedPlayPointsTable;
}): ExpectedPlayPoints => {
  const handKey = normalizePlayHandKey(keep);
  const handBucket = Reflect.get(table, handKey) as
    | ExpectedPlayHandBucket
    | undefined;
  if (!handBucket) {
    throw new Error(`Missing expected play points for ${handKey}`);
  }
  const roleBucket =
    role === CribRole.Dealer ? handBucket.Dealer : handBucket.Pone;

  const dealer = toPlayerBreakdown(roleBucket.players.Dealer);
  const pone = toPlayerBreakdown(roleBucket.players.Pone);
  const expectedDelta =
    role === CribRole.Dealer
      ? dealer.total - pone.total
      : pone.total - dealer.total;
  if (Math.abs(expectedDelta - roleBucket.mu) > COMPONENT_TOLERANCE) {
    throw new Error("Expected play delta does not match player totals");
  }

  return { dealer, delta: roleBucket.mu, pone };
};
