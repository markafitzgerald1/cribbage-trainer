import {
  type PlayUncertainty,
  playRecordIdentity,
} from "../game/playUncertainty";
import { type Card } from "../game/Card";
import { type CribRole } from "../game/expectedCribPoints";
import { normalizePlayHandKey } from "../game/expectedPlayPoints";
import { uncertaintyStandardError } from "../game/uncertaintySidecar";

export interface PlayDeltaStandardErrorOptions {
  readonly keep: readonly Card[];
  readonly role: CribRole;
  readonly uncertainty: PlayUncertainty;
}

/*
 * A direct lookup, not a combination: the displayed You - Opp total is one
 * published `key/role/delta` mean, so what the sidecar reports for that same
 * record is its standard error outright. Nothing is weighted and nothing is
 * summed, so none of the crib bound's dependence reasoning applies here and
 * its wording must not be carried across. The delta's own standard error
 * already preserves the own-minus-opponent pairing within each simulation,
 * which is why it is read rather than reconstructed from the two seat totals.
 *
 * What it does not cover is the policy. The play sidecar's `provenance`
 * carries `joint_policy_converged: false`, and `policy_uncertainty: null` is
 * a top-level field rather than a provenance one, so this is sampling error
 * around a frozen, non-converged policy and the part it omits has no
 * published magnitude. Nothing displaying it may imply it is the total
 * uncertainty of the expected pegging difference.
 *
 * Null when the sidecar publishes no record for the hand and role, which is an
 * unavailable capability rather than a measured zero. No valid kept hand
 * reaches it today - the published sidecar covers all 1,820 hands in both
 * roles, asserted in playUncertainty.test.ts.
 */
export const playDeltaStandardError = ({
  keep,
  role,
  uncertainty,
}: PlayDeltaStandardErrorOptions): number | null =>
  uncertaintyStandardError(
    uncertainty,
    playRecordIdentity({ handKey: normalizePlayHandKey(keep), role }),
  );
