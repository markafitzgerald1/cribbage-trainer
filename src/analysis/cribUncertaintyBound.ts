import {
  type CribRole,
  type ExpectedCribDeal,
  type ExpectedCribStarterPoints,
  cribStarterRelationWeight,
  normalizeDiscardKey,
} from "../game/expectedCribPoints";
import {
  type CribUncertainty,
  cribRecordIdentity,
} from "../game/cribUncertainty";
import { INDICES_PER_SUIT, SUITS_PER_DECK } from "../game/Card";
import { uncertaintyStandardError } from "../game/uncertaintySidecar";

export const DECK_SIZE = INDICES_PER_SUIT * SUITS_PER_DECK;
const TOTAL_SLOT = "total";

export interface WeightedIdentity {
  readonly identity: string;
  readonly weight: number;
}

export interface CribUncertaintyBoundOptions extends ExpectedCribDeal {
  /** The per-starter-rank figures the displayed crib average was built from. */
  readonly cribStarterPoints: readonly ExpectedCribStarterPoints[];
  readonly uncertainty: CribUncertainty;
}

const relationIdentities = (
  discardKey: string,
  role: CribRole,
  starterPoints: ExpectedCribStarterPoints,
): readonly WeightedIdentity[] =>
  starterPoints.starterSuitRelationPoints.map((relation) => ({
    identity: cribRecordIdentity({
      discardKey,
      role,
      slot: relation.relation,
      starterRank: relation.starterRank,
    }),
    weight: relation.remainingStarterCount,
  }));

const starterIdentities = (
  discardKey: string,
  role: CribRole,
  starterPoints: ExpectedCribStarterPoints,
): readonly WeightedIdentity[] =>
  cribStarterRelationWeight(starterPoints) === 0
    ? [
        {
          identity: cribRecordIdentity({
            discardKey,
            role,
            slot: TOTAL_SLOT,
            starterRank: starterPoints.starterRank,
          }),
          weight: starterPoints.remainingStarterCount,
        },
      ]
    : relationIdentities(discardKey, role, starterPoints);

export const cribWeightedIdentities = ({
  cribStarterPoints,
  discard,
  role,
}: Pick<
  CribUncertaintyBoundOptions,
  "cribStarterPoints" | "discard" | "role"
>): readonly WeightedIdentity[] => {
  const discardKey = normalizeDiscardKey(discard);
  return cribStarterPoints
    .filter((starterPoints) => starterPoints.remainingStarterCount > 0)
    .flatMap((starterPoints) =>
      starterIdentities(discardKey, role, starterPoints),
    );
};

/*
 * The displayed crib average is a fixed non-negative combination of published
 * bucket means whose coefficients sum to one, so `sum(coefficient * se)` is
 * the dependence bound the sidecar contract names: it holds whatever the
 * missing cross-bucket covariance turns out to be. It is deliberately not the
 * independence form `sqrt(sum(coefficient^2 * se^2))`, which assumes that
 * covariance away - and which, measured on real hands here, lands near 0.005
 * and would display as nothing at the two decimals this app shows. The bound
 * is on the standard error, not a confidence interval: anything that turns it
 * into a threshold must scale it by a stated quantile, as
 * discardNoiseThreshold.ts does, rather than read it as one.
 *
 * Null when any bucket the average consumed has no published record. A
 * relation-based mean never falls back to its rank's root record, because the
 * root and relation records are alternative representations of the same
 * measurement rather than independent observations.
 */
export const cribUncertaintyBound = ({
  cribStarterPoints,
  discard,
  knownCards,
  role,
  uncertainty,
}: CribUncertaintyBoundOptions): number | null => {
  const weighted = cribWeightedIdentities({ cribStarterPoints, discard, role });

  let total = 0;
  for (const { identity, weight } of weighted) {
    const standardError = uncertaintyStandardError(uncertainty, identity);
    if (standardError === null) {
      return null;
    }
    total += weight * standardError;
  }

  return total / (DECK_SIZE - knownCards.length);
};
