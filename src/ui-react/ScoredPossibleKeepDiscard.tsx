import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import * as parentClasses from "./ScoredPossibleKeepDiscards.module.css";
import { useCallback, useState } from "react";
import type { Card } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import { PossibleHand } from "./PossibleHand";
import type { ScoredKeepDiscard } from "../analysis/analysis";
import { ScoredPossibleKeepDiscardExpandedRow } from "./ScoredPossibleKeepDiscardExpandedRow";
import { SortOrder } from "../ui/SortOrder";

export interface ScoredPossibleKeepDiscardProps {
  readonly scoredKeepDiscard: ScoredKeepDiscard<
    Card & { readonly dealOrder: number }
  >;
  readonly cribRole: CribRole;
  readonly sortOrder: SortOrder;
  readonly isHighlighted: boolean;
  readonly rowIndex: number;
}

const EXPECTED_POINTS_FRACTION_DIGITS = 2;
const ROW_STRIPE_DIVISOR = 2;
/*
 * The U+2212 minus sign matches the "+" advance width with tabular figures,
 * so signed columns stay aligned (the ASCII hyphen-minus is narrower).
 */
const MINUS_SIGN = "−";

const toRoundedForDisplay = (points: number): number =>
  Number(points.toFixed(EXPECTED_POINTS_FRACTION_DIGITS));

const toAlignedFixed = (points: number): string =>
  toRoundedForDisplay(points)
    .toFixed(EXPECTED_POINTS_FRACTION_DIGITS)
    .replace("-", MINUS_SIGN);

const formatDiscardLabel = (discard: readonly Card[]): string => {
  const [firstCard, secondCard] = discard as unknown as readonly [Card, Card];
  const firstString = `${firstCard.rankLabel}${firstCard.suit}`;
  const secondString = `${secondCard.rankLabel}${secondCard.suit}`;

  return `${firstString} ${secondString}`;
};

/*
 * The sign follows the rounded value rather than the raw one, so a quantity
 * that displays as zero displays as a plain "0.00": a leading "+" would claim
 * a gain the digits on screen do not show. Reachable from the shipped table
 * rather than hypothetical - keeping A 9 J K as dealer has an expected play
 * delta of 0.0017, which rendered as "+0.00".
 */
const formatSignedExpectedPoints = (points: number): string => {
  const formatted = toAlignedFixed(points);

  return toRoundedForDisplay(points) > 0 ? `+${formatted}` : formatted;
};

export function ScoredPossibleKeepDiscard({
  scoredKeepDiscard,
  cribRole,
  sortOrder,
  isHighlighted,
  rowIndex,
}: ScoredPossibleKeepDiscardProps) {
  const {
    keep,
    discard,
    expectedHandPoints,
    expectedNetPoints,
    expectedPlayPoints,
    signedExpectedCribPoints,
  } = scoredKeepDiscard;
  const discardLabel = formatDiscardLabel(discard);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRowClick = useCallback(() => {
    setIsExpanded((expanded) => !expanded);
  }, []);

  const handleExpandButtonClick = useCallback(
    (event: { readonly stopPropagation: () => void }) => {
      event.stopPropagation();
      handleRowClick();
    },
    [handleRowClick],
  );

  const handExpectedTotal = toAlignedFixed(expectedHandPoints);
  const cribExpectedTotal = formatSignedExpectedPoints(
    signedExpectedCribPoints,
  );
  const playExpectedTotal = formatSignedExpectedPoints(
    expectedPlayPoints.delta,
  );
  const netExpectedTotal = toAlignedFixed(expectedNetPoints);
  const rowStripeClass =
    rowIndex % ROW_STRIPE_DIVISOR === 0
      ? parentClasses.oddRow
      : parentClasses.evenRow;
  const renderHandDiscardCell = () => (
    <span className={classes.handDiscardCell}>
      <PossibleHand
        dealtCards={keep}
        sortOrder={sortOrder}
      />
      <span className={classes.discardGroup}>
        (
        <PossibleHand
          dealtCards={discard}
          sortOrder={sortOrder}
        />
        )
      </span>
      <button
        aria-expanded={isExpanded}
        aria-label={
          isExpanded
            ? `Collapse analysis for discard ${discardLabel}`
            : `Expand analysis for discard ${discardLabel}`
        }
        className={`${classes.expandIndicator} ${
          isExpanded ? classes.expandIndicatorExpanded : ""
        }`}
        onClick={handleExpandButtonClick}
        type="button"
      >
        ▸
      </button>
    </span>
  );

  return (
    <>
      <tr
        className={`${classes.scoredPossibleKeepDiscard} ${rowStripeClass} ${
          isHighlighted ? classes.highlighted : ""
        } ${classes.clickable}`}
        onClick={handleRowClick}
      >
        <td>{renderHandDiscardCell()}</td>
        <td className={classes.scoreCell}>{handExpectedTotal}</td>
        <td className={classes.scoreCell}>{cribExpectedTotal}</td>
        <td className={classes.scoreCell}>{playExpectedTotal}</td>
        <td className={classes.netScoreCell}>{netExpectedTotal}</td>
      </tr>
      {isExpanded ? (
        <ScoredPossibleKeepDiscardExpandedRow
          cribRole={cribRole}
          scoredKeepDiscard={scoredKeepDiscard}
          sortOrder={sortOrder}
        />
      ) : null}
    </>
  );
}
