import * as classes from "./ScoredPossibleKeepDiscardExpandedRow.module.css";
import { type OpeningPlayItem, openingPlayItems } from "./openingPlaysText";
import { type PegLinesSource, shippedPegLines } from "../game/pegLinesLoader";
import { type ReactNode, useCallback, useState } from "react";
import { type Card } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import { type PegLines } from "../game/pegLines";
import { normalizePlayHandKey } from "../game/expectedPlayPoints";

export const OPENING_PLAYS_FOOTER =
  "How a near-optimal player opened this hand in simulation. Mixing leads is deliberate.";
export const OPENING_PLAYS_UNAVAILABLE = "Opening plays unavailable";

export interface OpeningPlaysProps {
  readonly cribRole: CribRole;
  readonly keep: readonly Card[];
  readonly source?: PegLinesSource;
}

const renderItem = ({ cells, key, sentence }: OpeningPlayItem) => (
  <li key={key}>
    <span className={classes.visuallyHidden}>{sentence}</span>
    {cells.map(([column, text]) => (
      <span
        aria-hidden="true"
        key={column}
      >
        {text}
      </span>
    ))}
  </li>
);

const renderHeading = (isPone: boolean) =>
  isPone ? (
    <span aria-hidden="true">You lead</span>
  ) : (
    <div aria-hidden="true">
      <span>They lead</span>
      <span>You reply</span>
    </div>
  );

const renderItems = (items: readonly OpeningPlayItem[], isPone: boolean) => (
  <>
    <div className={isPone ? classes.openingPone : classes.openingDealer}>
      {renderHeading(isPone)}
      <ul>{items.map(renderItem)}</ul>
    </div>
    <div className={classes.playAssumption}>{OPENING_PLAYS_FOOTER}</div>
  </>
);

export function OpeningPlays({
  cribRole,
  keep,
  source = shippedPegLines,
}: OpeningPlaysProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lines, setLines] = useState(source.getPegLinesSync);
  const [hasFailed, setHasFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded(!isExpanded);
    if (isExpanded || lines !== null || isLoading) {
      return;
    }
    // Another row may already have loaded the file since this one mounted.
    const known = source.getPegLinesSync();
    if (known !== null) {
      setLines(known);
      return;
    }
    setIsLoading(true);
    const settle = (loaded: PegLines | null): void => {
      setIsLoading(false);
      setHasFailed(loaded === null);
      setLines(loaded);
    };
    source.loadPegLines().then(settle, () => {
      settle(null);
    });
  }, [isExpanded, isLoading, lines, source]);

  const renderBody = (): ReactNode => {
    const isPone = cribRole === CribRole.Pone;
    const items =
      lines === null
        ? null
        : openingPlayItems(lines, isPone, normalizePlayHandKey(keep));
    if (items !== null) {
      return renderItems(items, isPone);
    }
    return (
      <div>
        {lines === null && !hasFailed ? "Loading" : OPENING_PLAYS_UNAVAILABLE}
      </div>
    );
  };

  return (
    <div className={classes.playBreakdown}>
      <button
        aria-expanded={isExpanded}
        className={classes.breakdownSummaryButton}
        onClick={handleToggle}
        type="button"
      >
        <span className={classes.summaryLabel}>
          Opening plays
          <span
            aria-hidden="true"
            className={`${classes.expandIndicator} ${
              isExpanded ? classes.expandIndicatorExpanded : ""
            }`}
          >
            ▸
          </span>
        </span>
      </button>
      {isExpanded ? renderBody() : null}
    </div>
  );
}

OpeningPlays.defaultProps = {
  source: shippedPegLines,
};
