import {
  CANONICAL_ROLES,
  MINIMUM_OBSERVATIONS,
  type Uncertainty,
  type UncertaintyContract,
  recordWeight,
} from "./uncertaintySidecar";
import { type CribRole, STARTER_RANKS } from "./expectedCribPoints";
import { type ExpectedPlayPointsHandKey } from "./expectedPlayPoints";

/*
 * What version 1 pins for the play sidecar. The shared reader in
 * uncertaintySidecar.ts checks everything both documents have in common.
 *
 * Play publishes one standard error per kept hand and role, against the
 * table's own role-relative delta. There is no rank axis - `ranks` is
 * published empty - and `delta` is the only slot, so an identity spells three
 * parts rather than crib's four.
 */
const DELTA_SLOT = "delta";

/*
 * The four kept ranks in rank order, derived the way the contract describes
 * rather than read off the vendored means table: the two hold the same 1,820
 * keys as sets but in different orders, so the table's order would reject
 * every published sidecar. Repetition is allowed and order within a key is
 * not, which is what the non-decreasing slices express.
 */
export const CANONICAL_PLAY_HAND_KEYS: readonly string[] =
  STARTER_RANKS.flatMap((first, firstIndex) =>
    STARTER_RANKS.slice(firstIndex).flatMap((second, secondOffset) =>
      STARTER_RANKS.slice(firstIndex + secondOffset).flatMap(
        (third, thirdOffset) =>
          STARTER_RANKS.slice(firstIndex + secondOffset + thirdOffset).map(
            (fourth) => `${first}_${second}_${third}_${fourth}`,
          ),
      ),
    ),
  );

/*
 * Play weights are a count of simulations rather than a sum of weights, and
 * the exporter publishes no `sum_w2`, so the weighted-variance denominator
 * crib checks has nothing to read here and no rule to stand in for it. Every
 * published record carries the same `n` of 13,000.
 *
 * The whole-number check is this repository's reading of `simulation_count`
 * rather than a rule the contract states: a count of simulations that is not
 * a whole number is not a count. It can only fire on a document claiming
 * `simulation_count` while carrying a fraction, since a table that switched
 * to an effective sample size would have to declare different semantics, and
 * the header check rejects that first.
 */
const supportsTheSampledStatistic = (record: object): boolean => {
  const simulations = recordWeight(record, "n");
  return Number.isInteger(simulations) && simulations >= MINIMUM_OBSERVATIONS;
};

export const PLAY_UNCERTAINTY_CONTRACT: UncertaintyContract = {
  identityFields: ["keys", "roles", "slots"],
  nSemantics: "simulation_count",
  /*
   * The contract states that play provenance retains its policy fingerprint
   * and `joint_policy_converged`, and the pegging figure's copy rests on the
   * second of them. Crib requires neither; its own published provenance
   * carries neither, and its qualification is about the weighted estimator.
   */
  requiredProvenance: ["joint_policy_converged", "policy_fingerprint"],
  supportsTheStatistic: supportsTheSampledStatistic,
  table: "play",
  vocabulary: {
    keys: CANONICAL_PLAY_HAND_KEYS,
    ranks: [],
    roles: CANONICAL_ROLES,
    slots: [DELTA_SLOT],
  },
  weightFields: ["n"],
};

export type PlayUncertainty = Uncertainty;

export interface PlayRecordIdentityParts {
  readonly handKey: ExpectedPlayPointsHandKey;
  readonly role: CribRole;
}

export const playRecordIdentity = ({
  handKey,
  role,
}: PlayRecordIdentityParts): string => `${handKey}/${role}/${DELTA_SLOT}`;
