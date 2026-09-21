import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import { type ExpectedCribPointsTable } from "../game/expectedCribPoints";
import { type ExpectedPlayPointsTable } from "../game/expectedPlayPoints";

export type LoadCribTable = () => Promise<ExpectedCribPointsTable>;
export type LoadPlayTable = () => Promise<ExpectedPlayPointsTable>;

export interface ExpectedTables {
  readonly crib: ExpectedCribPointsTable;
  readonly play: ExpectedPlayPointsTable;
}

/*
 * Both consumers of the means - the analysis table and the mistake queue's
 * deferred classifications - need the same pair and the same handling of an
 * absent one, so the pair lives here rather than being spelled twice.
 * Explicit null checks rather than truthiness, because the shared loaders use
 * null for absence and a caller may validly inject a falsy table.
 */
export const readSynchronousExpectedTables = (): ExpectedTables | null => {
  const crib = cribLoader.getTableSync();
  const play = playLoader.getTableSync();
  return crib !== null && play !== null ? { crib, play } : null;
};

export const loadExpectedTables = (
  loadCribTable: LoadCribTable,
  loadPlayTable: LoadPlayTable,
): Promise<ExpectedTables> =>
  Promise.all([loadCribTable(), loadPlayTable()]).then(([crib, play]) => ({
    crib,
    play,
  }));
