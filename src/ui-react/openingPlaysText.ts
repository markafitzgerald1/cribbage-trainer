import {
  ALWAYS_SHARE,
  type ShownOpening,
  foldOpenings,
  replyShare,
} from "../game/openingPlays";
import type { PegDealerRow, PegLeadRow, PegLines } from "../game/pegLines";
import { CARD_LABELS } from "../game/Card";

const PERCENT = 100;

type Cell = readonly [column: string, text: string];

// One row of the display: the sentence a screen reader hears, and the cells shown in its place.
export interface OpeningPlayItem {
  readonly cells: readonly Cell[];
  readonly key: string;
  readonly sentence: string;
}

/*
 * A share that rounds to 0% or 100% without being exactly that says so, so
 * neither a rare play nor a near-certain one reads as a measured extreme.
 */
const percentText = (share: number, below: string, above: string): string => {
  const percent = Math.round(share * PERCENT);
  if (percent === 0) {
    return below;
  }
  return percent === PERCENT && share < 1 ? above : `${percent}%`;
};

export const formatShare = (share: number): string =>
  percentText(share, "<1%", ">99%");

const spoken = (share: number): string =>
  `in ${percentText(share, "less than 1%", "more than 99%")}`;

const rankText = (rank: number): string => CARD_LABELS.at(rank) as string;

const poneItem = ({ row, share }: ShownOpening<PegLeadRow>) => ({
  cells: [["lead", `${rankText(row.lead)} ${formatShare(share)}`]] as const,
  key: rankText(row.lead),
  sentence: `You lead ${rankText(row.lead)} ${spoken(share)} of hands`,
});

const dealerItem = ({ row, share }: ShownOpening<PegDealerRow>) => {
  const reply = replyShare(row);
  const isAlways = reply >= ALWAYS_SHARE;
  return {
    cells: [
      ["lead", rankText(row.lead)],
      ["share", formatShare(share)],
      ["reply", rankText(row.response)],
      ["replyShare", isAlways ? "always" : formatShare(reply)],
    ] as const,
    key: rankText(row.lead),
    sentence: `They lead ${rankText(row.lead)} ${spoken(share)} of hands, and you reply ${rankText(row.response)} ${isAlways ? "every time" : `${spoken(reply)} of those`}`,
  };
};

const otherItem = (isPone: boolean, share: number): OpeningPlayItem => ({
  cells: isPone
    ? [["lead", `other ${formatShare(share)}`]]
    : [
        ["lead", "other"],
        ["share", formatShare(share)],
      ],
  key: "other",
  sentence: `${isPone ? "You" : "They"} lead another rank ${spoken(share)} of hands`,
});

function itemsOf<Row extends PegLeadRow>(
  rows: readonly Row[] | null,
  toItem: (opening: ShownOpening<Row>) => OpeningPlayItem,
  isPone: boolean,
): readonly OpeningPlayItem[] | null {
  if (rows === null) {
    return null;
  }
  const { otherShare, shown } = foldOpenings(rows);
  const other = otherShare > 0 ? [otherItem(isPone, otherShare)] : [];
  return [...shown.map(toItem), ...other];
}

// Null when the file holds no rows for this hand and seat: unavailable, never zero.
export const openingPlayItems = (
  lines: PegLines,
  isPone: boolean,
  handKey: string,
): readonly OpeningPlayItem[] | null =>
  isPone
    ? itemsOf(lines.poneRows(handKey), poneItem, true)
    : itemsOf(lines.dealerRows(handKey), dealerItem, false);
