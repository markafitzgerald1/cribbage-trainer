import type { PegDealerRow, PegLeadRow } from "./pegLines";

/*
 * Mark's thresholds for #878 part (b), decided 2026-11-25: a play chosen in
 * under 5% of simulations, or seen fewer than 200 times, folds into "other".
 * Every shipped hand has 13,000 simulations per seat, so today only the share
 * rule binds; the count rule guards a partial file, where 5% could rest on a
 * handful of deals.
 */
export const MINIMUM_SHOWN_SHARE = 0.05;
export const MINIMUM_SHOWN_COUNT = 200;
export const ALWAYS_SHARE = 0.995;

export interface ShownOpening<Row extends PegLeadRow> {
  readonly row: Row;
  readonly share: number;
}

export interface FoldedOpenings<Row extends PegLeadRow> {
  readonly otherShare: number;
  readonly shown: readonly ShownOpening<Row>[];
}

const countOf = (rows: readonly PegLeadRow[]): number =>
  rows.reduce((sum, row) => sum + row.count, 0);

// Most played first; ties in rank order.
export function foldOpenings<Row extends PegLeadRow>(
  rows: readonly Row[],
): FoldedOpenings<Row> {
  const total = countOf(rows);
  const shown = rows
    .filter(
      ({ count }) =>
        count >= MINIMUM_SHOWN_COUNT && count / total >= MINIMUM_SHOWN_SHARE,
    )
    .sort((left, right) => right.count - left.count || left.lead - right.lead);
  return {
    otherShare: (total - countOf(shown)) / total,
    shown: shown.map((row) => ({ row, share: row.count / total })),
  };
}

// The file publishes only the modal reply, so this is never a comparison between replies.
export const replyShare = ({ count, responseCount }: PegDealerRow): number =>
  responseCount / count;
