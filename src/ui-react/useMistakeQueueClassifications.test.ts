import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import { act, renderHook } from "@testing-library/react";
import {
  clearClassificationCache,
  useMistakeQueueClassifications,
} from "./useMistakeQueueClassifications";
import { describe, expect, it, jest } from "@jest/globals";
import { mockItemA, mockItemB } from "../ui/mistakeQueue.test.common";
import type { MistakeQueueItem } from "../ui/mistakeQueue";
import { setAnalysisTables } from "./Trainer.test.common";

const invalidItem: MistakeQueueItem = {
  ...mockItemA,
  handKey: "invalid_item_hand",
  previousDiscard: "ZZ,YY",
};

const runRejectionTest = async (): Promise<string | null> => {
  clearClassificationCache();
  cribLoader.setTableSync(null);
  playLoader.setTableSync(null);
  const spy = jest
    .spyOn(cribLoader, "loadTable")
    .mockRejectedValueOnce(new Error("Network failure"));

  try {
    const { result } = renderHook(() =>
      useMistakeQueueClassifications(true, [mockItemA], 10),
    );

    await act(async () => {
      await Promise.resolve();
    });

    return result.current(mockItemA);
  } finally {
    spy.mockRestore();
  }
};

const createChunkTestHarness = (keyPrefix: string) => {
  clearClassificationCache();
  setAnalysisTables();
  const queue = Array.from({ length: 7 }, (_, index) => ({
    ...mockItemA,
    handKey: `${keyPrefix}_${index}`,
  }));

  return {
    queue,
    rendered: renderHook(() => useMistakeQueueClassifications(true, queue, 10)),
  };
};

const runChunkingTest = (): readonly [string | null, string | null] => {
  jest.useFakeTimers();
  try {
    const { queue, rendered } = createChunkTestHarness("hand_chunk");

    expect(rendered.result.current(queue[0]!)).toBe("Hand");
    expect(rendered.result.current(queue[4]!)).toBe("Hand");
    expect(rendered.result.current(queue[5]!)).toBeNull();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    return [
      rendered.result.current(queue[5]!),
      rendered.result.current(queue[6]!),
    ];
  } finally {
    jest.useRealTimers();
  }
};

const runUnmountTest = (): number => {
  jest.useFakeTimers();
  try {
    const { rendered } = createChunkTestHarness("hand_unmount");

    rendered.unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });

    return jest.getTimerCount();
  } finally {
    jest.useRealTimers();
  }
};

describe("useMistakeQueueClassifications", () => {
  it.each([
    {
      expected: null,
      items: [mockItemB],
      name: "returns null when previousDiscard is null",
      show: true,
      target: mockItemB,
    },
    {
      expected: "Hand",
      items: [mockItemA],
      name: "caches and returns classification for valid item",
      show: true,
      target: mockItemA,
    },
    {
      expected: null,
      items: [invalidItem],
      name: "caches null when previousDiscard cannot be parsed",
      show: true,
      target: invalidItem,
    },
    {
      expected: null,
      items: [mockItemA],
      name: "does not classify when show is false",
      show: false,
      target: mockItemA,
    },
    {
      expected: null,
      items: null,
      name: "does not classify when items is null",
      show: true,
      target: mockItemA,
    },
  ])("$name", ({ expected, items, show, target }) => {
    clearClassificationCache();
    setAnalysisTables();

    const { result } = renderHook(() =>
      useMistakeQueueClassifications(show, items, 10),
    );

    expect(result.current(target)).toBe(expected);
  });

  it("loads tables asynchronously when tables are initially null", async () => {
    clearClassificationCache();
    cribLoader.setTableSync(null);
    playLoader.setTableSync(null);

    const asyncRender = renderHook(() =>
      useMistakeQueueClassifications(true, [mockItemA], 10),
    );

    expect(asyncRender.result.current(mockItemA)).toBeNull();

    await act(async () => {
      await Promise.resolve();
    });

    expect(asyncRender.result.current(mockItemA)).toBe("Hand");
  });

  it("handles table load rejection gracefully", async () => {
    const classification = await runRejectionTest();

    expect(classification).toBeNull();
  });

  it("reads null tables synchronously when play table is missing", () => {
    clearClassificationCache();
    setAnalysisTables();
    playLoader.setTableSync(null);

    const missingPlayRender = renderHook(() =>
      useMistakeQueueClassifications(false, [mockItemA], 10),
    );

    expect(missingPlayRender.result.current(mockItemA)).toBeNull();
  });

  it("processes items in chunks and schedules remaining chunks", () => {
    const [sixthClassification, seventhClassification] = runChunkingTest();

    expect(sixthClassification).toBe("Hand");
    expect(seventhClassification).toBe("Hand");
  });

  it("clears scheduled timeout when unmounted mid-chunking", () => {
    const remainingTimers = runUnmountTest();

    expect(remainingTimers).toBe(0);
  });

  it("clears classification cache via clearClassificationCache", () => {
    clearClassificationCache();
    setAnalysisTables();

    const initialRender = renderHook(() =>
      useMistakeQueueClassifications(true, [mockItemA], 10),
    );

    expect(initialRender.result.current(mockItemA)).toBe("Hand");

    clearClassificationCache();

    const resetRender = renderHook(() =>
      useMistakeQueueClassifications(false, [mockItemA], 10),
    );

    expect(resetRender.result.current(mockItemA)).toBeNull();
  });
});
