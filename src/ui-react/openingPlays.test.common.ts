import type { PegDealerRow, PegLeadRow, PegLines } from "../game/pegLines";
import type { PegLinesSource } from "../game/pegLinesLoader";
import { parseCard } from "../game/Card";

// Hand 2_3_7_8 as published in the vendored lines file, as [lead, count, reply, reply count].
export const FIXTURE_HAND_KEY = "2_3_7_8";
export const FIXTURE_KEEP = ["8D", "2C", "7H", "3S"].map(parseCard);

export const lead = (rank: number, count: number): PegLeadRow => ({
  count,
  lead: rank,
  mean: 0,
  standardError: 0,
});

const dealerLead = ([rank, count, response, responseCount]: readonly [
  number,
  number,
  number,
  number,
]): PegDealerRow => ({ ...lead(rank, count), response, responseCount });

const PONE_ROWS = [lead(1, 5515), lead(2, 7485)];

const DEALER_ROWS = (
  [
    [0, 696, 2, 475],
    [1, 1078, 1, 1078],
    [2, 1689, 2, 1689],
    [3, 2492, 6, 2487],
    [5, 989, 6, 989],
    [6, 846, 7, 846],
    [7, 659, 7, 622],
    [8, 521, 2, 481],
    [9, 1239, 2, 1238],
    [10, 1313, 2, 1249],
    [11, 918, 2, 697],
    [12, 560, 2, 560],
  ] as const
).map(dealerLead);

export const FIXTURE_LINES: PegLines = {
  dealerRows: (handKey) => (handKey === FIXTURE_HAND_KEY ? DEALER_ROWS : null),
  policyConverged: false,
  poneRows: (handKey) => (handKey === FIXTURE_HAND_KEY ? PONE_ROWS : null),
  qualifications: { missing: "m", policy: "p", statistics: "s" },
};

export const sourceOf = (
  load: () => Promise<PegLines | null>,
  known: PegLines | null = null,
): PegLinesSource => ({ getPegLinesSync: () => known, loadPegLines: load });

export const resolvingSource = (lines: PegLines | null): PegLinesSource =>
  sourceOf(async () => Promise.resolve(lines));
