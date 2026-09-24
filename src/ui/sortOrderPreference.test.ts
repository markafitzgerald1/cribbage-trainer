import {
  clearStoredSortOrder,
  readStoredSortOrder,
  sortOrderKey,
  storeSortOrder,
} from "./sortOrderPreference";
import { describe, expect, it, jest } from "@jest/globals";
import { SortOrder } from "./SortOrder";

describe("sortOrderPreference", () => {
  it("returns null when no preference is stored", () => {
    clearStoredSortOrder();

    expect(readStoredSortOrder()).toBeNull();
  });

  it.each([
    [SortOrder.DealOrder, "deal-order"],
    [SortOrder.Descending, "descending"],
    [SortOrder.Ascending, "ascending"],
  ])("stores and reads %s as %s", (sortOrder, expectedStoredValue) => {
    storeSortOrder(sortOrder);

    expect(localStorage.getItem(sortOrderKey)).toBe(expectedStoredValue);
    expect(readStoredSortOrder()).toBe(sortOrder);
  });

  it("returns null for unrecognized or corrupted stored values", () => {
    localStorage.setItem(sortOrderKey, "invalid-sort");

    expect(readStoredSortOrder()).toBeNull();
  });

  it("handles storage exceptions gracefully when reading", () => {
    const getItemSpy = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementationOnce(() => {
        throw new Error("QuotaExceededError or SecurityError");
      });

    const result = readStoredSortOrder();
    getItemSpy.mockRestore();

    expect(result).toBeNull();
  });

  it("handles storage exceptions gracefully when writing", () => {
    const setItemSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

    let threw = false;
    try {
      storeSortOrder(SortOrder.Ascending);
    } catch {
      threw = true;
    }
    setItemSpy.mockRestore();

    expect(threw).toBe(false);
  });

  it("handles storage exceptions gracefully when clearing", () => {
    const removeItemSpy = jest
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementationOnce(() => {
        throw new Error("SecurityError");
      });

    let threw = false;
    try {
      clearStoredSortOrder();
    } catch {
      threw = true;
    }
    removeItemSpy.mockRestore();

    expect(threw).toBe(false);
  });
});
