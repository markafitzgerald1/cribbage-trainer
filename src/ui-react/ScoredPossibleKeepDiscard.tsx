import * as classes from "./ScoredPossibleKeepDiscard.module.css";
import * as parentClasses from "./ScoredPossibleKeepDiscards.module.css";
import {
  type MistakeClassification,
  formatNetLoss,
} from "../analysis/classifyMistake";
import { useCallback, useState } from "react";
import type { Card } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import { PossibleHand } from "./PossibleHand";
import type { ScoredKeepDiscard } from "../analysis/analysis";
import { ScoredPossibleKeepDiscardExpandedRow } from "./ScoredPossibleKeepDiscardExpandedRow";
import { SortOrder } from "../ui/SortOrder";

export interface ScoredPossibleKeepDiscardProps {
  readonly classification?: MistakeClassification | null;
  readonly cribRole: CribRole;
  readonly isHighlighted: boolean;
  readonly rowIndex: number;
  readonly scoredKeepDiscard: ScoredKeepDiscard<
    Card & { readonly dealOrder: number }
  >;
  readonly sortOrder: SortOrder;
}

const EXPECTED_POINTS_FRACTION_DIGITS = 2;
const ROW_STRIPE_DIVISOR = 2;
/*
 * The U+2212 minus sign matches the "+" advance width with tabular figures,
 * so signed columns stay aligned (the ASCII hyphen-minus is narrower).
 */
const MINUS_SIGN = "−";

const toAlignedFixed = (points: number): string => {
  const roundedPoints = Number(points.toFixed(EXPECTED_POINTS_FRACTION_DIGITS));

  return roundedPoints
    .toFixed(EXPECTED_POINTS_FRACTION_DIGITS)
    .replace("-", MINUS_SIGN);
};

const getRowTitle = (classification?: MistakeClassification | null): string => {
  if (classification) {
    const loss = formatNetLoss(classification.netLoss);
    return `Chosen discard (${loss} pts lost): ${classification.label}`;
  }
  return "Optimal discard";
};

const formatDiscardLabel = (discard: readonly Card[]): string => {
  const [firstCard, secondCard] = discard as unknown as readonly [Card, Card];
  const firstString = `${firstCard.rankLabel}${firstCard.suit}`;
  const secondString = `${secondCard.rankLabel}${secondCard.suit}`;

  return `${firstString} ${secondString}`;
};

const formatSignedExpectedPoints = (points: number): string => {
  const formatted = toAlignedFixed(points);

  return points > 0 ? `+${formatted}` : formatted;
};

export function ScoredPossibleKeepDiscard({
  classification,
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

  const rowContent = (
    <>
      <td>{renderHandDiscardCell()}</td>
      <td className={classes.scoreCell}>{handExpectedTotal}</td>
      <td className={classes.scoreCell}>{cribExpectedTotal}</td>
      <td className={classes.scoreCell}>{playExpectedTotal}</td>
      <td className={classes.netScoreCell}>{netExpectedTotal}</td>
    </>
  );
  const rowClassName = `${classes.scoredPossibleKeepDiscard} ${rowStripeClass} ${
    isHighlighted ? classes.highlighted : ""
  } ${classes.clickable}`;

  return (
    <>
      {isHighlighted ? (
        <tr
          className={rowClassName}
          onClick={handleRowClick}
          title={getRowTitle(classification)}
        >
          {rowContent}
        </tr>
      ) : (
        <tr
          className={rowClassName}
          onClick={handleRowClick}
        >
          {rowContent}
        </tr>
      )}
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

ScoredPossibleKeepDiscard.defaultProps = {
  classification: null,
};
