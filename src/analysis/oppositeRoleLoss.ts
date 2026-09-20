import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import { formatAccessibleNetLoss, formatNetLoss } from "./classifyMistake";
import {
  isChosenDiscard,
  maxExpectedNetPoints,
  withoutFloatResidue,
} from "./discardQuality";
import type { Card } from "../game/Card";
import type { ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import { allScoredKeepDiscardsByExpectedNetScoreDescending } from "./analysis";

export const oppositeCribRole = (cribRole: CribRole): CribRole =>
  cribRole === CribRole.Dealer ? CribRole.Pone : CribRole.Dealer;

const cribRoleName = (cribRole: CribRole): string =>
  cribRole === CribRole.Dealer ? "dealer" : "pone";

export interface OppositeRoleLossParams {
  readonly cards: readonly Card[];
  readonly chosenDiscardCards: readonly Card[];
  readonly cribRole: CribRole;
  readonly tables: {
    readonly crib: ExpectedCribPointsTable;
    readonly play: ExpectedPlayPointsTable;
  };
}

/*
 * What the same discard would have cost had the crib belonged to the other
 * player: this app's own enumeration run a second time with the role
 * reversed, over the same six dealt cards, so it consumes no input the
 * actual-role analysis did not already consume.
 *
 * Measured rather than collapsed into a flag saying the player read the
 * role backwards (#824, scope change of 2026-09-19): a flag would assert a
 * cause the reader cannot check, and would be coincidence rather than
 * diagnosis in about one recorded mistake in twenty-three.
 *
 * Both quantities are taken as a maximum over the enumeration rather than
 * by locating a row, so neither can be missing and no unreachable defensive
 * branch is created. A chosen discard absent from the list yields
 * -Infinity, and the subtraction then Infinity rather than a
 * plausible-looking number.
 */
export const oppositeRoleExpectedPointsLoss = ({
  cards,
  chosenDiscardCards,
  cribRole,
  tables,
}: OppositeRoleLossParams): number => {
  const scored = allScoredKeepDiscardsByExpectedNetScoreDescending(
    cards,
    oppositeCribRole(cribRole),
    tables,
  );
  const chosen = scored.filter((option) =>
    isChosenDiscard(option, chosenDiscardCards),
  );
  return withoutFloatResidue(
    maxExpectedNetPoints(scored) - maxExpectedNetPoints(chosen),
  );
};

export interface RoleLossPairLabel {
  readonly accessibleLabel: string;
  // Everything up to the reversed-role figure, separator included, so a caller can mark that figure without re-deriving where its clause starts.
  readonly leadingText: string;
  // Empty whenever the label states one figure, which a caller reads as "no pair here" rather than repeating the comparison below.
  readonly oppositeRoleCost: string;
  readonly oppositeRoleCostsNothing: boolean;
}

// Read from the formatter the reader sees, so a mark cannot disagree with the glyphs beside it, and exact rather than rounded: a positive sub-cent loss prints "< 0.01", never "0.00". No tolerance to tune.
const costsNothing = (loss: number): boolean =>
  formatNetLoss(loss) === formatNetLoss(0);

/*
 * States what the discard cost, and states it twice only when the second
 * figure carries something. Deliberately not "you discarded as pone": what
 * was measured is what each role would have cost, and the reader is better
 * placed than this code to say why.
 *
 * Two strict tiers, both exact and neither with a tolerance to tune: the
 * pair appears only when the reversed role would have cost **less** than
 * the one actually held, and the mark only when it would have cost nothing,
 * which is strictly inside that. `skills/ui-layout-and-interaction/SKILL.md`
 * has why a higher reversed cost is withheld rather than shown, and a null
 * `oppositeLoss` — every decision recorded before store version 6 — takes
 * that same single-figure wording rather than printing an unmeasured zero.
 */
export const roleLossPairLabel = (
  cribRole: CribRole,
  actualLoss: number,
  oppositeLoss: number | null,
): RoleLossPairLabel => {
  if (oppositeLoss === null || oppositeLoss >= actualLoss) {
    return {
      accessibleLabel: `${formatAccessibleNetLoss(actualLoss)} points lost`,
      leadingText: `${formatNetLoss(actualLoss)} pts lost`,
      oppositeRoleCost: "",
      oppositeRoleCostsNothing: false,
    };
  }
  const oppositeRoleName = cribRoleName(oppositeCribRole(cribRole));
  // Spelled from the accessible formatter rather than reusing the visible clause, because screen readers announce a bare "<" inconsistently or not at all.
  const accessibleOpposite = `${formatAccessibleNetLoss(oppositeLoss)} as ${oppositeRoleName}`;
  return {
    accessibleLabel: `${formatAccessibleNetLoss(actualLoss)} points lost as ${cribRoleName(cribRole)}, ${accessibleOpposite}`,
    leadingText: `${formatNetLoss(actualLoss)} as ${cribRoleName(cribRole)}, `,
    oppositeRoleCost: `${formatNetLoss(oppositeLoss)} as ${oppositeRoleName}`,
    oppositeRoleCostsNothing: costsNothing(oppositeLoss),
  };
};
