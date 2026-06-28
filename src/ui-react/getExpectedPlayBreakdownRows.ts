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

const toCategories = ({
  pointBreakdown,
  total,
}: ExpectedPlayPlayerBreakdown): readonly ExpectedPlayBreakdownCategory[] =>
  [
    pointBreakdown.fifteens,
    pointBreakdown.thirtyOnes,
    pointBreakdown.pairs,
    pointBreakdown.runs,
    pointBreakdown.go,
    pointBreakdown.lastCard,
    total,
  ].map((value, index) => ({
    label: EXPECTED_PLAY_CATEGORY_LABELS.at(index) as string,
    value,
  }));

const subtractPlayers = (
  player: ExpectedPlayPlayerBreakdown,
  opponent: ExpectedPlayPlayerBreakdown,
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
  total: player.total - opponent.total,
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
      categories: toCategories(subtractPlayers(player, opponent)),
      label: "You - Opp",
    },
  ];
};
