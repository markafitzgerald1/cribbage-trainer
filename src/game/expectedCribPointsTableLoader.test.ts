import { describe, expect, it } from "@jest/globals";
import {
  getTableSync as getCribTableSync,
  loadTable as loadCribTable,
  setTableSync as setCribTableSync,
} from "./expectedCribPointsTableLoader";
import {
  getTableSync as getPlayTableSync,
  loadTable as loadPlayTable,
  setTableSync as setPlayTableSync,
} from "./expectedPlayPointsTableLoader";
import { type ExpectedCribPointsTable } from "./expectedCribPoints";
import { type ExpectedPlayPointsTable } from "./expectedPlayPoints";
import { type ExpectedPointsTableLoader } from "./expectedPointsTableLoader";

interface LoaderTestCase extends ExpectedPointsTableLoader<unknown> {
  readonly fakeTable: unknown;
  readonly name: string;
}

const LOADER_CASES: readonly LoaderTestCase[] = [
  {
    fakeTable: {},
    getTableSync: getCribTableSync,
    loadTable: loadCribTable,
    name: "crib",
    setTableSync: (table) =>
      setCribTableSync(table as ExpectedCribPointsTable | null),
  },
  {
    fakeTable: {},
    getTableSync: getPlayTableSync,
    loadTable: loadPlayTable,
    name: "play",
    setTableSync: (table) =>
      setPlayTableSync(table as ExpectedPlayPointsTable | null),
  },
];

describe("expected points table loaders", () => {
  it.each(LOADER_CASES)(
    "loads, shares, and caches the $name table",
    async ({ getTableSync, loadTable, setTableSync }) => {
      setTableSync(null);

      expect(getTableSync()).toBeNull();

      const first = loadTable();
      const second = loadTable();
      const sharesPromise = first === second;
      const loadedTable = await first;

      expect(sharesPromise).toBe(true);
      expect(typeof loadedTable).toBe("object");
      expect(getTableSync()).toBe(loadedTable);
      await expect(loadTable()).resolves.toBe(loadedTable);
    },
  );

  it.each(LOADER_CASES)(
    "supports synchronous $name table injection",
    async ({ fakeTable, getTableSync, loadTable, setTableSync }) => {
      setTableSync(fakeTable);

      expect(getTableSync()).toBe(fakeTable);
      await expect(loadTable()).resolves.toBe(fakeTable);
    },
  );
});
