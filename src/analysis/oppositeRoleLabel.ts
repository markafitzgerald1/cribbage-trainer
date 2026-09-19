import { CribRole } from "../game/expectedCribPoints";

export const oppositeCribRole = (cribRole: CribRole): CribRole =>
  cribRole === CribRole.Dealer ? CribRole.Pone : CribRole.Dealer;

const cribRoleName = (cribRole: CribRole): string =>
  cribRole === CribRole.Dealer ? "dealer" : "pone";

export interface OppositeRoleLabel {
  readonly accessibleLabel: string;
  readonly label: string;
}

/*
 * Wording for the #824 cause, shared so the live analysis caption and the
 * mistake queue name it identically. It states the derived fact — this
 * discard is equal-best under the other crib role — rather than the
 * intention behind it, which nothing here observes.
 *
 * Both strings name the reversed role, so neither is an exact match for the
 * "Dealer" and "Pone" controls the mistake queue and the trainer already
 * expose, and neither contains the "Crib role" filter legend.
 */
export const oppositeRoleLabel = (cribRole: CribRole): OppositeRoleLabel => ({
  accessibleLabel: `optimal as ${cribRoleName(oppositeCribRole(cribRole))}, not as ${cribRoleName(cribRole)}`,
  label: `Optimal as ${cribRoleName(oppositeCribRole(cribRole))}`,
});
