/* jscpd:ignore-start */
import {
  type CribRole,
  type ExpectedCribStarterPoints,
} from "../game/expectedCribPoints";
import { DECK_SIZE, cribWeightedIdentities } from "./cribUncertaintyBound";
import {
  type PlayUncertainty,
  playRecordIdentity,
} from "../game/playUncertainty";
import { type Card } from "../game/Card";
import { type CribUncertainty } from "../game/cribUncertainty";
import { normalizePlayHandKey } from "../game/expectedPlayPoints";
import { uncertaintyStandardError } from "../game/uncertaintySidecar";
import { withoutFloatResidue } from "./discardQuality";
/* jscpd:ignore-end */

/*
 * The one-sided 95% quantile of the standard normal distribution, Φ⁻¹(0.95).
 * Mark chose the 95% level for #774 on 2026-09-25; the level is the product
 * decision and this number is only its exact consequence, so it is not a
 * tuned tolerance. One-sided because the question is whether the chosen
 * discard is truly worse than the best, never whether it is truly better.
 */
export const ONE_SIDED_95_PERCENT_Z = 1.6448536269514722;

export interface NoiseCandidate {
  readonly cribStarterPoints: readonly ExpectedCribStarterPoints[];
  readonly discard: readonly Card[];
  readonly expectedNetPoints: number;
  readonly keep: readonly Card[];
}

export interface DiscardNoiseThresholdOptions {
  readonly best: NoiseCandidate;
  readonly chosen: NoiseCandidate;
  readonly cribUncertainty: CribUncertainty;
  readonly knownCards: readonly Card[];
  readonly playUncertainty: PlayUncertainty;
  readonly role: CribRole;
}

/*
 * Signed per-identity weights of best minus chosen, still in integer
 * remaining-starter counts: both averages share the one denominator of
 * unseen cards, so dividing once afterwards keeps a record both candidates
 * consume canceling exactly instead of to within float residue. A shared
 * record is one measurement, so its error cancels in the difference; adding
 * the two single-candidate bounds would count it twice.
 */
const cribCoefficientDifferences = (
  options: DiscardNoiseThresholdOptions,
): ReadonlyMap<string, number> => {
  const differences = new Map<string, number>();
  const accumulate = (
    candidate: NoiseCandidate,
    combine: (sum: number, weight: number) => number,
  ): void => {
    for (const { identity, weight } of cribWeightedIdentities({
      cribStarterPoints: candidate.cribStarterPoints,
      discard: candidate.discard,
      role: options.role,
    })) {
      differences.set(
        identity,
        combine(differences.get(identity) ?? 0, weight),
      );
    }
  };
  accumulate(options.best, (sum, weight) => sum + weight);
  accumulate(options.chosen, (sum, weight) => sum - weight);
  return differences;
};

/*
 * An upper bound on the standard error of the crib difference, for the same
 * reason cribUncertaintyBound's is: the sidecar publishes marginal standard
 * errors without the covariance between them, and `sum(|coefficient| * se)` holds
 * whatever those turn out to be. Null when a consumed record is unpublished.
 */
export const cribDifferenceStandardErrorBound = (
  options: DiscardNoiseThresholdOptions,
): number | null => {
  let total = 0;
  for (const [identity, weight] of cribCoefficientDifferences(options)) {
    if (weight !== 0) {
      const standardError = uncertaintyStandardError(
        options.cribUncertainty,
        identity,
      );
      if (standardError === null) {
        return null;
      }
      total += Math.abs(weight) * standardError;
    }
  }
  return total / (DECK_SIZE - options.knownCards.length);
};

/*
 * Play delta records are seeded independently by key, role and sample, so
 * the difference of two distinct records has standard error
 * `sqrt(se_best^2 + se_chosen^2)` exactly. Two keeps of the same ranks read
 * one record - suits do not enter the play key - and a record subtracted
 * from itself has no error at all.
 */
export const playDifferenceStandardError = ({
  best,
  chosen,
  playUncertainty,
  role,
}: DiscardNoiseThresholdOptions): number | null => {
  const bestIdentity = playRecordIdentity({
    handKey: normalizePlayHandKey(best.keep),
    role,
  });
  const chosenIdentity = playRecordIdentity({
    handKey: normalizePlayHandKey(chosen.keep),
    role,
  });
  if (bestIdentity === chosenIdentity) {
    return 0;
  }
  const bestError = uncertaintyStandardError(playUncertainty, bestIdentity);
  const chosenError = uncertaintyStandardError(playUncertainty, chosenIdentity);
  return bestError === null || chosenError === null
    ? null
    : Math.hypot(bestError, chosenError);
};

/*
 * The loss below which a positive expected-net-point difference is treated as
 * simulation noise, one-sided at 95%. The crib and play tables come from
 * separate simulation runs, so their errors combine in quadrature; hand points
 * are exact enumeration and contribute none. The crib term is an upper bound
 * on its standard error, so for a comparison fixed in advance the threshold is
 * conservative under the normal approximation - but this comparison is not
 * fixed: "best" is the largest of fifteen noisy estimates, so no coverage
 * guarantee is claimed. That selection effect, pegging-policy uncertainty (the
 * play sidecar publishes it as unavailable) and calibration belong to #853.
 *
 * Null when either difference has an unpublished record: unavailable
 * uncertainty never becomes zero uncertainty, and no suppression follows.
 */
export const discardNoiseThreshold = (
  options: DiscardNoiseThresholdOptions,
): number | null => {
  const cribError = cribDifferenceStandardErrorBound(options);
  const playError = playDifferenceStandardError(options);
  return cribError === null || playError === null
    ? null
    : ONE_SIDED_95_PERCENT_Z * Math.hypot(cribError, playError);
};

export const discardLoss = ({
  best,
  chosen,
}: Pick<DiscardNoiseThresholdOptions, "best" | "chosen">): number =>
  withoutFloatResidue(best.expectedNetPoints - chosen.expectedNetPoints);

/*
 * Equality belongs to the noise side, and the comparison uses full-precision
 * figures so a later change to display rounding cannot move a verdict.
 */
export const isWithinNoise = (
  loss: number,
  threshold: number | null,
): boolean => threshold !== null && loss > 0 && loss <= threshold;
