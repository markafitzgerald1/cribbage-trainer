import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import { type Card } from "../game/Card";
import { type ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import { allScoredKeepDiscardsByExpectedNetScoreDescending } from "./analysis";
import expectedCribPointsTableData from "../game/expectedCribPointsTable.json";
import expectedPlayPointsTableData from "../game/expectedPlayPointsTable.json";

export const expectedCribPointsTable =
  expectedCribPointsTableData as unknown as ExpectedCribPointsTable;
export const expectedPlayPointsTable =
  expectedPlayPointsTableData as unknown as ExpectedPlayPointsTable;

export const scoreDeal = (
  cards: readonly Card[],
  cribRole: CribRole = CribRole.Dealer,
  table: ExpectedCribPointsTable = expectedCribPointsTable,
) =>
  allScoredKeepDiscardsByExpectedNetScoreDescending(cards, cribRole, {
    crib: table,
    play: expectedPlayPointsTable,
  });
