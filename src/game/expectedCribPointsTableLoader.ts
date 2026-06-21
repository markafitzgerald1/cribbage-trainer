import { type ExpectedCribPointsTable } from "./expectedCribPoints";

let table: ExpectedCribPointsTable | null = null;
let loadPromise: Promise<ExpectedCribPointsTable> | null = null;

export const loadTable = (): Promise<ExpectedCribPointsTable> => {
  if (table) {
    return Promise.resolve(table);
  }
  if (!loadPromise) {
    loadPromise = import("./expectedCribPointsTable.json").then((module) => {
      table = module.default as unknown as ExpectedCribPointsTable;
      return table;
    });
  }
  return loadPromise;
};

export const getTableSync = (): ExpectedCribPointsTable | null => table;

export const setTableSync = (
  newTable: ExpectedCribPointsTable | null,
): void => {
  table = newTable;
  loadPromise = newTable ? Promise.resolve(newTable) : null;
};
