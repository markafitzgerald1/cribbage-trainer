import { act, renderHook } from "@testing-library/react";
import {
  clearStoredSortOrder,
  readStoredSortOrder,
  storeSortOrder,
} from "../ui/sortOrderPreference";
import { describe, expect, it, jest } from "@jest/globals";
import { SortOrder } from "../ui/SortOrder";
import { useSortOrder } from "./useSortOrder";

const renderSortOrderHook = (initialSortOrder: SortOrder | null = null) => {
  const markHistoryUpdate = jest.fn();
  const { result } = renderHook(() =>
    useSortOrder(initialSortOrder, markHistoryUpdate),
  );

  return { markHistoryUpdate, result };
};

describe("useSortOrder", () => {
  it.each([
    {
      expected: SortOrder.DealOrder,
      initial: SortOrder.DealOrder,
      setup: () => storeSortOrder(SortOrder.Ascending),
      stored: SortOrder.Ascending,
      title: "prefers explicit initialSortOrder over stored preference",
    },
    {
      expected: SortOrder.Ascending,
      initial: null,
      setup: () => storeSortOrder(SortOrder.Ascending),
      stored: SortOrder.Ascending,
      title: "reads stored preference when initialSortOrder is null",
    },
    {
      expected: SortOrder.Descending,
      initial: null,
      setup: clearStoredSortOrder,
      stored: null,
      title:
        "defaults to Descending when no initialSortOrder and no stored preference",
    },
  ])("$title", ({ expected, initial, setup, stored }) => {
    setup();
    const { markHistoryUpdate, result } = renderSortOrderHook(initial);

    expect(result.current.sortOrder).toBe(expected);
    expect(readStoredSortOrder()).toBe(stored);
    expect(markHistoryUpdate).not.toHaveBeenCalled();
  });

  it("updates state, marks history, and persists preference on changeSortOrder", () => {
    clearStoredSortOrder();
    const { markHistoryUpdate, result } = renderSortOrderHook();

    act(() => result.current.changeSortOrder(SortOrder.Ascending));

    expect(markHistoryUpdate).toHaveBeenCalledTimes(1);
    expect(readStoredSortOrder()).toBe(SortOrder.Ascending);
    expect(result.current.sortOrder).toBe(SortOrder.Ascending);
  });

  it("updates state without marking history or storing on setSortOrder", () => {
    storeSortOrder(SortOrder.Descending);
    const { markHistoryUpdate, result } = renderSortOrderHook();

    act(() => {
      result.current.setSortOrder(SortOrder.DealOrder);
    });

    expect(result.current.sortOrder).toBe(SortOrder.DealOrder);
    expect(readStoredSortOrder()).toBe(SortOrder.Descending);
    expect(markHistoryUpdate).not.toHaveBeenCalled();
  });
});
