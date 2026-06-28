import {
  type ExpectedPlayPlayerBreakdown,
  type ExpectedPlayPoints,
} from "../game/expectedPlayPoints";
import { CribRole } from "../game/expectedCribPoints";

export interface ExpectedPlayBreakdownCategory {
  readonly label: string;
  readonly value: number;
}

export interface ExpectedPlayBreakdownRow {
  readonly categories: readonly ExpectedPlayBreakdownCategory[];
  readonly label: string;
}

type ExpectedPlayBreakdownRows = readonly [
  ExpectedPlayBreakdownRow,
  ExpectedPlayBreakdownRow,
  ExpectedPlayBreakdownRow,
];

export const EXPECTED_PLAY_CATEGORY_LABELS = [
  "15s",
  "31s",
  "Pairs",
  "Runs",
  "Go",
  "Last",
  "Total",
] as const;

// Zip each label with its value so labels stay type-safe (no at(index) cast).
const toCategories = ({
  pointBreakdown,
  total,
}: ExpectedPlayPlayerBreakdown): readonly ExpectedPlayBreakdownCategory[] =>
  (
    [
      ["15s", pointBreakdown.fifteens],
      ["31s", pointBreakdown.thirtyOnes],
      ["Pairs", pointBreakdown.pairs],
      ["Runs", pointBreakdown.runs],
      ["Go", pointBreakdown.go],
      ["Last", pointBreakdown.lastCard],
      ["Total", total],
    ] as const
  ).map(([label, value]) => ({ label, value }));

/*
 * The collapsed Play column, net score, and sort all use the table's
 * role-relative delta (`points.delta`), which can round differently from the
 * difference of the two rounded seat totals. Use the delta for the row total so
 * the expanded "You - Opp" total always matches the score it drives.
 */
const subtractPlayers = (
  player: ExpectedPlayPlayerBreakdown,
  opponent: ExpectedPlayPlayerBreakdown,
  delta: number,
): ExpectedPlayPlayerBreakdown => ({
  pointBreakdown: {
    fifteens: player.pointBreakdown.fifteens - opponent.pointBreakdown.fifteens,
    go: player.pointBreakdown.go - opponent.pointBreakdown.go,
    lastCard: player.pointBreakdown.lastCard - opponent.pointBreakdown.lastCard,
    pairs: player.pointBreakdown.pairs - opponent.pointBreakdown.pairs,
    runs: player.pointBreakdown.runs - opponent.pointBreakdown.runs,
    thirtyOnes:
      player.pointBreakdown.thirtyOnes - opponent.pointBreakdown.thirtyOnes,
  },
  total: delta,
});

export const getExpectedPlayBreakdownRows = (
  points: ExpectedPlayPoints,
  role: CribRole,
): ExpectedPlayBreakdownRows => {
  const player = role === CribRole.Dealer ? points.dealer : points.pone;
  const opponent = role === CribRole.Dealer ? points.pone : points.dealer;

  return [
    { categories: toCategories(points.pone), label: "Pone" },
    { categories: toCategories(points.dealer), label: "Dealer" },
    {
      categories: toCategories(subtractPlayers(player, opponent, points.delta)),
      label: "You - Opp",
    },
  ];
};
