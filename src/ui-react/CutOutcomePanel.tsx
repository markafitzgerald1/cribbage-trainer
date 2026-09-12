import * as classes from "./CutOutcomePanel.module.css";
import { type CutOutcomeOption, toCutOutcome } from "./cutOutcome";
import { Fragment, useMemo } from "react";
import {
  MINUS_SIGN,
  formatCount,
  formatSignedCount,
  toAlignedFixed,
} from "./formatExpectedPoints";
import type { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import type { HandCut } from "../game/cutStarter";
import { PossibleHand } from "./PossibleHand";
import { PossibleHandCard } from "./PossibleHandCard";
import { SortOrder } from "../ui/SortOrder";
import { cutCounts } from "../game/cutCounts";
import { isSamePhysicalCard } from "../game/Card";

export interface CutOutcomePanelProps {
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];
  // Net-score ordered, so its head is the discard the app recommends.
  readonly scoredKeepDiscardsByNetScore: readonly CutOutcomeOption[];
  readonly sortOrder: SortOrder;
}

interface OutcomeRow {
  readonly label: string;
  readonly option: CutOutcomeOption;
}

const COLUMN_HEADINGS = ["Hand", "Crib", "Total", "Avg"] as const;

/*
 * Both discards hold exactly two cards, so a one-directional subset test is
 * set equality here. Compared by rank and suit rather than by object identity,
 * because a caller may have rebuilt the cards — a history restore does.
 */
const isSameDiscard = (first: CutOutcomeOption, second: CutOutcomeOption) =>
  first.discard.every((card) =>
    second.discard.some((other) => isSamePhysicalCard(card, other)),
  );

/*
 * Hand plus crib in expectation, the same quantity the three count columns add
 * up to for this one cut. Pegging is excluded from both sides: the app has no
 * client-side opponent to peg against, so a cut says nothing about it, and
 * carrying it on the expectation side alone would make the columns
 * incomparable.
 */
const expectedTotal = (option: CutOutcomeOption) =>
  option.expectedHandPoints + option.signedExpectedCribPoints;

/*
 * The digit-width minus sign keeps the columns aligned but reads poorly aloud,
 * so the spoken summary spells the sign out instead.
 */
const spoken = (formatted: string) =>
  formatted.replace(MINUS_SIGN, "minus ").replace("+", "plus ");

const toRows = (
  chosen: CutOutcomeOption,
  best: CutOutcomeOption,
): readonly OutcomeRow[] =>
  isSameDiscard(chosen, best)
    ? [{ label: "Yours, the top choice", option: chosen }]
    : [
        { label: "Yours", option: chosen },
        { label: "Top choice", option: best },
      ];

export function CutOutcomePanel({
  cribRole,
  dealtCards,
  scoredKeepDiscardsByNetScore,
  sortOrder,
}: CutOutcomePanelProps) {
  /*
   * The cut is derived from the six dealt cards and never drawn from the
   * injected generator, so deriving it here — on every render — cannot shift
   * what a seeded deep link deals next. See `cutForHand`.
   */
  const { best, chosen, cut } = useMemo(
    () => toCutOutcome(dealtCards, scoredKeepDiscardsByNetScore),
    [dealtCards, scoredKeepDiscardsByNetScore],
  );

  /*
   * The visual grid is hidden from assistive technology, which reads the
   * per-row summary below instead: a screen reader would otherwise receive a
   * flat run of headings and numbers with nothing tying the two together.
   *
   * A real `<table>` would carry those relationships natively, and was the
   * first thing tried. It is not used because this panel renders inside the
   * analysis figure: `ScoredPossibleKeepDiscards.module.css` styles `table`
   * and `th` as descendants of that figure, so the sticky green header rules
   * would land on this panel too, and a second table in the document makes
   * the suite's bare `getByRole("table")`, `getByRole("columnheader")` and
   * `tbody tr` locators ambiguous — including numeric `getByRole("cell")`
   * lookups in specs that have nothing to do with this feature, which would
   * then collide or not depending on the hand dealt.
   */
  const renderHeadings = () => (
    <>
      <div className={classes.rowLabel} />
      {COLUMN_HEADINGS.map((heading) => (
        <div
          aria-hidden="true"
          className={classes.columnHeading}
          key={heading}
        >
          {heading}
        </div>
      ))}
    </>
  );

  const renderRowLabel = ({ label, option }: OutcomeRow, summary: string) => (
    <div className={classes.rowLabel}>
      <span
        aria-hidden="true"
        className={classes.rowLabelText}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className={classes.rowLabelCards}
      >
        <PossibleHand
          dealtCards={option.discard}
          sortOrder={sortOrder}
        />
      </span>
      <span className={classes.spokenSummary}>{summary}</span>
    </div>
  );

  const renderRow = (row: OutcomeRow, starterCut: HandCut) => {
    const counts = cutCounts({
      cribRole,
      discard: row.option.discard,
      keep: row.option.keep,
      opponentCribCards: starterCut.opponentCribCards,
      starter: starterCut.starter,
    });
    const hand = formatCount(counts.handPoints);
    const crib = formatSignedCount(counts.signedCribPoints);
    const total = formatCount(counts.total);
    const average = toAlignedFixed(expectedTotal(row.option));
    const summary = `${row.label}: hand ${spoken(hand)}, crib ${spoken(crib)}, total ${spoken(total)}, average ${spoken(average)}`;
    return (
      <Fragment key={row.label}>
        {renderRowLabel(row, summary)}
        <div
          aria-hidden="true"
          className={classes.count}
        >
          {hand}
        </div>
        <div
          aria-hidden="true"
          className={classes.count}
        >
          {crib}
        </div>
        <div
          aria-hidden="true"
          className={classes.total}
        >
          {total}
        </div>
        <div
          aria-hidden="true"
          className={classes.average}
        >
          {average}
        </div>
      </Fragment>
    );
  };

  /*
   * Nothing to show until a discard is complete and the analysis has scored
   * the alternatives — the panel's whole content is a comparison, and half of
   * one would be worse than none.
   */
  if (!chosen || !best) {
    return null;
  }

  return (
    <section
      aria-label="Starter cut outcome"
      className={classes.cutOutcomePanel}
    >
      <div className={classes.cutHeader}>
        <span className={classes.cutHeaderText}>This cut</span>
        <span className={classes.starterCard}>
          <PossibleHandCard
            rank={cut.starter.rank}
            suit={cut.starter.suit}
          />
        </span>
        <span className={classes.sampleNote}>one sample, not a verdict</span>
      </div>
      <div className={classes.grid}>
        {renderHeadings()}
        {toRows(chosen, best).map((row) => renderRow(row, cut))}
      </div>
      <p className={classes.footnote}>
        One cut only. Avg averages all 46 cuts against a modelled opponent,
        where this crib takes two random cards. A better discard often loses
        one. Pegging is excluded.
      </p>
    </section>
  );
}
