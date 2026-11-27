import type { Rank } from "./Card";

// The contract is simulate-cribbage-games docs/policy-shards.md.
const MAGIC = Array.from("CPS1", (letter) => letter.charCodeAt(0));
const HEADER_BYTES = 8;
const HISTORY_BYTES = 8;
const HIGH_WORD_OFFSET = 4;
const RANK_SLOTS = 4;
const COUNT_BYTES = 2;
const MINIMUM_WIDTH = 2;
const RANKS = 13;
export const POLICY_DENOMINATOR = 1000;
// Thirteen four-bit events: 16 ** 13, which is 2 ** 52.
const HISTORY_KEY_LIMIT = 4_503_599_627_370_496;
const WORD = 4_294_967_296;
const HALF = 2;
const NIBBLE = 16;
const NOT_FOUND = -1;

export interface PolicyRow {
  readonly ranks: readonly Rank[];
  readonly counts: readonly number[];
  readonly supported: boolean;
}

export interface PolicyShard {
  readonly rowCount: number;
  readonly lookup: (historyKey: number) => PolicyRow | null;
}

interface Columns {
  readonly view: DataView;
  readonly rows: number;
  readonly ranksAt: number;
  readonly widthsAt: number;
  readonly supportAt: number;
  readonly countsAt: number;
}

// Every event is a token from 1 to 15, so no nibble below the top may be 0.
const isPackedHistory = (history: number): boolean => {
  let rest = history;
  while (rest > 0) {
    if (rest % NIBBLE === 0) {
      return false;
    }
    rest = Math.floor(rest / NIBBLE);
  }
  return true;
};

const readHistories = (columns: Columns): Float64Array | null => {
  const histories = new Float64Array(columns.rows);
  let previous = 0;
  for (let row = 0; row < columns.rows; row += 1) {
    const at = HEADER_BYTES + row * HISTORY_BYTES;
    const delta =
      columns.view.getUint32(at, true) +
      columns.view.getUint32(at + HIGH_WORD_OFFSET, true) * WORD;
    const history = previous + delta;
    if (
      (row > 0 && delta === 0) ||
      history >= HISTORY_KEY_LIMIT ||
      !isPackedHistory(history)
    ) {
      return null;
    }
    histories.set([history], row);
    previous = history;
  }
  return histories;
};

const readRanks = (
  columns: Columns,
  row: number,
  width: number,
): Rank[] | null => {
  const slots = Array.from({ length: RANK_SLOTS }, (_, slot) =>
    columns.view.getUint8(columns.ranksAt + row * RANK_SLOTS + slot),
  );
  const ranks = slots.slice(0, width);
  const canonical = [...new Set(ranks)].sort((left, right) => left - right);
  const ascending =
    canonical.join() === ranks.join() && ranks.every((rank) => rank < RANKS);
  const padded = slots.slice(width).every((slot) => slot === 0);
  return ascending && padded ? (ranks as Rank[]) : null;
};

const readCounts = (view: DataView, at: number, width: number): number[] =>
  Array.from({ length: width }, (_, index) =>
    view.getUint16(at + index * COUNT_BYTES, true),
  );

const readRows = (columns: Columns): PolicyRow[] | null => {
  const rows: PolicyRow[] = [];
  let at = columns.countsAt;
  for (let row = 0; row < columns.rows; row += 1) {
    const width = columns.view.getUint8(columns.widthsAt + row);
    const support = columns.view.getUint8(columns.supportAt + row);
    if (width < MINIMUM_WIDTH || width > RANK_SLOTS || support > 1) {
      return null;
    }
    const ranks = readRanks(columns, row, width);
    const end = at + width * COUNT_BYTES;
    if (ranks === null || end > columns.view.byteLength) {
      return null;
    }
    const counts = readCounts(columns.view, at, width);
    if (counts.reduce((sum, count) => sum + count, 0) !== POLICY_DENOMINATOR) {
      return null;
    }
    rows.push({ counts, ranks, supported: support === 1 });
    at = end;
  }
  return at === columns.view.byteLength ? rows : null;
};

const historyAt = (histories: Float64Array, index: number): number =>
  histories.at(index) as number;

const findRow = (histories: Float64Array, key: number): number => {
  let low = 0;
  let high = histories.length;
  while (low < high) {
    const middle = Math.floor((low + high) / HALF);
    if (historyAt(histories, middle) < key) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low < histories.length && historyAt(histories, low) === key
    ? low
    : NOT_FOUND;
};

const columnsOf = (payload: Uint8Array): Columns | null => {
  if (
    payload.length < HEADER_BYTES ||
    MAGIC.some((byte, index) => payload.at(index) !== byte)
  ) {
    return null;
  }
  const view = new DataView(
    payload.buffer,
    payload.byteOffset,
    payload.byteLength,
  );
  const rows = view.getUint32(MAGIC.length, true);
  const ranksAt = HEADER_BYTES + rows * HISTORY_BYTES;
  const widthsAt = ranksAt + rows * RANK_SLOTS;
  const supportAt = widthsAt + rows;
  const countsAt = supportAt + rows;
  return countsAt + rows * MINIMUM_WIDTH * COUNT_BYTES > payload.length
    ? null
    : { countsAt, ranksAt, rows, supportAt, view, widthsAt };
};

export const parsePolicyShard = (payload: Uint8Array): PolicyShard | null => {
  const columns = columnsOf(payload);
  const histories = columns === null ? null : readHistories(columns);
  const rows =
    columns === null || histories === null ? null : readRows(columns);
  if (histories === null || rows === null) {
    return null;
  }
  return {
    lookup: (historyKey) => {
      const index = findRow(histories, historyKey);
      return index === NOT_FOUND ? null : (rows.at(index) as PolicyRow);
    },
    rowCount: rows.length,
  };
};

export const drawPolicyRank = (
  row: PolicyRow,
  legal: readonly Rank[],
  draw: number,
): Rank => {
  const sameMenu =
    row.ranks.length === legal.length &&
    row.counts.length === legal.length &&
    row.ranks.every((rank, index) => rank === legal.at(index));
  const total = row.counts.reduce((sum, count) => sum + count, 0);
  if (
    !sameMenu ||
    total !== POLICY_DENOMINATOR ||
    !Number.isInteger(draw) ||
    draw < 0 ||
    draw >= POLICY_DENOMINATOR
  ) {
    throw new Error("The stored menu or the draw does not fit this decision");
  }
  let remaining = draw;
  const index = row.counts.findIndex((count) => {
    remaining -= count;
    return remaining < 0;
  });
  return row.ranks.at(index) as Rank;
};
