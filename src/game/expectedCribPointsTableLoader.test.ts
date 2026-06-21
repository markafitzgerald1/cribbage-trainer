import { describe, expect, it } from "@jest/globals";
import {
  getTableSync,
  loadTable,
  setTableSync,
} from "./expectedCribPointsTableLoader";
import { type ExpectedCribPointsTable } from "./expectedCribPoints";

describe("expectedCribPointsTableLoader", () => {
  it("loads the table asynchronously and caches it", async () => {
    setTableSync(null);

    expect(getTableSync()).toBeNull();

    const loadedTable = await loadTable();

    expect(typeof loadedTable).toBe("object");
    expect(getTableSync()).toBe(loadedTable);

    // Call again to test the cached if (table) branch
    const secondLoad = await loadTable();

    expect(secondLoad).toBe(loadedTable);
  });

  it("handles concurrent loads without duplicate imports", async () => {
    setTableSync(null);

    const promise1 = loadTable();
    const promise2 = loadTable();

    const isSamePromise = promise1 === promise2;

    expect(isSamePromise).toBe(true);

    const result = await promise1;

    expect(typeof result).toBe("object");
  });

  it("supports setting table synchronously with non-null value", async () => {
    const fakeTable = {} as ExpectedCribPointsTable;
    setTableSync(fakeTable);

    expect(getTableSync()).toBe(fakeTable);

    const loaded = await loadTable();

    expect(loaded).toBe(fakeTable);
  });
});
