import {
  CANONICAL_ROLES,
  MINIMUM_OBSERVATIONS,
  type Uncertainty,
  type UncertaintyContract,
  recordWeight,
} from "./uncertaintySidecar";
import { STARTER_RANKS } from "./expectedCribPoints";

/*
 * What version 1 pins for the crib sidecar. The shared reader in
 * uncertaintySidecar.ts checks everything both documents have in common; this
 * file is only the half the contract names per table.
 *
 * The rank list is the app's own `STARTER_RANKS`, in the order the contract
 * requires, rather than a second copy that could drift from it, and the key
 * sequence is derived from it the way the contract describes: both ranks in
 * rank order, `Suited` before `Unsuited`, and no suited pair, since two cards
 * of one rank cannot share a suit.
 */
const CANONICAL_SLOTS = [
  "total",
  "matching_discard_suit",
  "non_matching_discard_suit",
  "matching_rank_1_suit",
  "matching_rank_2_suit",
];

const CANONICAL_DISCARD_KEYS: readonly string[] = STARTER_RANKS.flatMap(
  (first, index) =>
    STARTER_RANKS.slice(index).flatMap((second) =>
      first === second
        ? [`${first}_${second}_Unsuited`]
        : [`${first}_${second}_Suited`, `${first}_${second}_Unsuited`],
    ),
);

/*
 * Crib weights are a sum of weights rather than a count of hands, so the
 * exporter omits a record with fewer than two effective observations or a
 * non-positive weighted-variance denominator `n - sum_w2 / n`. Every
 * published record clears both by a wide margin (the smallest `n` is 5,663
 * and the smallest denominator 5,662.98), so this rejects nothing that ships
 * today.
 */
const supportsTheWeightedStatistic = (record: object): boolean => {
  const weight = recordWeight(record, "n");
  return (
    weight >= MINIMUM_OBSERVATIONS &&
    weight - recordWeight(record, "sum_w2") / weight > 0
  );
};

export const CRIB_UNCERTAINTY_CONTRACT: UncertaintyContract = {
  identityFields: ["keys", "roles", "ranks", "slots"],
  nSemantics: "sum_weights",
  supportsTheStatistic: supportsTheWeightedStatistic,
  table: "crib",
  vocabulary: {
    keys: CANONICAL_DISCARD_KEYS,
    ranks: STARTER_RANKS,
    roles: CANONICAL_ROLES,
    slots: CANONICAL_SLOTS,
  },
  weightFields: ["n", "sum_w2"],
};

export type CribUncertainty = Uncertainty;

export interface CribRecordIdentityParts {
  readonly discardKey: string;
  readonly role: string;
  readonly slot: string;
  readonly starterRank: string;
}

export const cribRecordIdentity = ({
  discardKey,
  role,
  slot,
  starterRank,
}: CribRecordIdentityParts): string =>
  `${discardKey}/${role}/${starterRank}/${slot}`;
