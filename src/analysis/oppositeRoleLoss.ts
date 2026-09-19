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
 * player: the app's own enumeration run a second time with the role
 * reversed, minus nothing else. Both this and the actual-role loss are
 * derived results over the same six dealt cards, so the pair consumes no
 * input the actual-role analysis did not already consume.
 *
 * The pair is kept and shown rather than collapsed into a flag saying the
 * player read the role backwards (#824, scope change of 2026-09-19). A flag
 * would assert a cause the reader cannot check, and would be coincidence
 * rather than diagnosis in about one recorded mistake in twenty-three; two
 * numbers state what was measured and leave the conclusion to the reader.
 * That also means there is no threshold here, and none is needed.
 *
 * Both quantities are taken as a maximum over the enumeration rather than
 * by locating a row, so neither can be missing and no unreachable defensive
 * branch is created. A chosen discard absent from the list would yield
 * -Infinity, and the subtraction then yields Infinity rather than a
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

  // Empty only when no reversed-role figure was ever measured.
  readonly oppositeRoleCost: string;
  readonly oppositeRoleCostsNothing: boolean;
}

const NO_COST = formatNetLoss(0);

/*
 * Read from the formatter the reader is looking at rather than from the raw
 * number, so the mark cannot disagree with the glyphs beside it. This is an
 * exact zero and not a rounded one: `formatNetLoss` prints a positive
 * sub-cent loss as "< 0.01", so no cost that exists reaches "0.00", and
 * there is no tolerance here to tune.
 */
const costsNothing = (loss: number): boolean => formatNetLoss(loss) === NO_COST;

/*
 * States the two measured costs and stops there. Deliberately not "you
 * discarded as pone": what was measured is what each role would have cost,
 * and the reader is better placed than this code to say why.
 *
 * `oppositeLoss` is null when the figure is unknown — every decision
 * recorded before store version 6 has none — and the wording then falls
 * back to the single figure this caption carried before #824 rather than
 * printing a zero nobody measured.
 *
 * `oppositeRoleCostsNothing` marks the one pairing that says anything: the
 * same two cards cost nothing under the reversed role and something under
 * the role held. Two costs, or two zeroes, are just numbers. It stays a
 * mark on the figure rather than a verdict in words, for the reason the
 * pair replaced a flag in the first place.
 */
export const roleLossPairLabel = (
  cribRole: CribRole,
  actualLoss: number,
  oppositeLoss: number | null,
): RoleLossPairLabel => {
  if (oppositeLoss === null) {
    return {
      accessibleLabel: `${formatAccessibleNetLoss(actualLoss)} points lost`,
      leadingText: `${formatNetLoss(actualLoss)} pts lost`,
      oppositeRoleCost: "",
      oppositeRoleCostsNothing: false,
    };
  }
  const opposite = `${formatNetLoss(oppositeLoss)} as ${cribRoleName(oppositeCribRole(cribRole))}`;
  return {
    accessibleLabel: `${formatAccessibleNetLoss(actualLoss)} points lost as ${cribRoleName(cribRole)}, ${opposite}`,
    leadingText: `${formatNetLoss(actualLoss)} as ${cribRoleName(cribRole)}, `,
    oppositeRoleCost: opposite,
    oppositeRoleCostsNothing:
      costsNothing(oppositeLoss) && !costsNothing(actualLoss),
  };
};
