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

const renderAndFlushPromises = async () => {
  const rendered = renderHook(() =>
    useMistakeQueueClassifications(true, [mockItemA], 10),
  );

  await act(async () => {
    await Promise.resolve();
  });

  return rendered;
};

const runRejectionTest = async (): Promise<string | null> => {
  clearClassificationCache();
  cribLoader.setTableSync(null);
  playLoader.setTableSync(null);
  const spy = jest
    .spyOn(cribLoader, "loadTable")
    .mockRejectedValueOnce(new Error("Network failure"));

  try {
    const { result } = await renderAndFlushPromises();

    return result.current(mockItemA)?.label ?? null;
  } finally {
    spy.mockRestore();
  }
};

const createChunkTestHarness = (keyPrefix: string) => {
  clearClassificationCache();
  setAnalysisTables();
  const queue = Array.from({ length: 3 }, (_, index) => ({
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
    const advanceNextTask = () => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
    };

    // Initially unclassified before timer fires (non-blocking mount)
    expect(rendered.result.current(queue[0]!)).toBeNull();

    // First timer tick processes first item
    advanceNextTask();

    expect(rendered.result.current(queue[0]!)?.label).toBe(
      "Hand loss > Play gain",
    );
    expect(rendered.result.current(queue[1]!)).toBeNull();

    // Second timer tick processes second item
    advanceNextTask();

    return [
      rendered.result.current(queue[1]!)?.label ?? null,
      rendered.result.current(queue[2]!)?.label ?? null,
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

interface ClassificationTestResult {
  readonly isLossPositive: boolean;
  readonly label: string | null;
}

const renderAndRunTimers = (
  show: boolean,
  items: readonly MistakeQueueItem[] | null,
) => {
  const rendered = renderHook(() =>
    useMistakeQueueClassifications(show, items, 10),
  );

  act(() => {
    jest.runAllTimers();
  });

  return rendered;
};

const runClassificationsTest = (
  show: boolean,
  items: readonly MistakeQueueItem[] | null,
  target: MistakeQueueItem,
): ClassificationTestResult => {
  jest.useFakeTimers();
  try {
    clearClassificationCache();
    setAnalysisTables();

    const { result } = renderAndRunTimers(show, items);
    const classification = result.current(target);
    const label = classification?.label ?? null;
    const isLossPositive = (classification?.netLoss ?? 0) > 0;

    return { isLossPositive, label };
  } finally {
    jest.useRealTimers();
  }
};

const runAsyncLoadTest = async (): Promise<string | null> => {
  jest.useFakeTimers();
  try {
    clearClassificationCache();
    cribLoader.setTableSync(null);
    playLoader.setTableSync(null);

    const asyncRender = await renderAndFlushPromises();

    act(() => {
      jest.runAllTimers();
    });

    return asyncRender.result.current(mockItemA)?.label ?? null;
  } finally {
    jest.useRealTimers();
  }
};

const runClearCacheTest = (): readonly [string | null, unknown] => {
  jest.useFakeTimers();
  try {
    clearClassificationCache();
    setAnalysisTables();

    const initialRender = renderAndRunTimers(true, [mockItemA]);
    const initialLabel = initialRender.result.current(mockItemA)?.label ?? null;

    clearClassificationCache();

    const resetRender = renderHook(() =>
      useMistakeQueueClassifications(false, [mockItemA], 10),
    );

    return [initialLabel, resetRender.result.current(mockItemA)];
  } finally {
    jest.useRealTimers();
  }
};

describe("useMistakeQueueClassifications", () => {
  it.each([
    {
      expected: null,
      expectedLossPositive: false,
      items: [mockItemB],
      name: "returns null when previousDiscard is null",
      show: true,
      target: mockItemB,
    },
    {
      expected: "Hand loss > Play gain",
      expectedLossPositive: true,
      items: [mockItemA],
      name: "caches and returns classification for valid item",
      show: true,
      target: mockItemA,
    },
    {
      expected: null,
      expectedLossPositive: false,
      items: [invalidItem],
      name: "caches null when previousDiscard cannot be parsed",
      show: true,
      target: invalidItem,
    },
    {
      expected: null,
      expectedLossPositive: false,
      items: [mockItemA],
      name: "does not classify when show is false",
      show: false,
      target: mockItemA,
    },
    {
      expected: null,
      expectedLossPositive: false,
      items: null,
      name: "does not classify when items is null",
      show: true,
      target: mockItemA,
    },
  ])("$name", ({ expected, expectedLossPositive, items, show, target }) => {
    const result = runClassificationsTest(show, items, target);

    expect(result.label).toBe(expected);
    expect(result.isLossPositive).toBe(expectedLossPositive);
  });

  it("loads tables asynchronously when tables are initially null", async () => {
    const label = await runAsyncLoadTest();

    expect(label).toBe("Hand loss > Play gain");
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
    const [secondClassification, thirdClassification] = runChunkingTest();

    expect(secondClassification).toBe("Hand loss > Play gain");
    expect(thirdClassification).toBeNull();
  });

  it("clears scheduled timeout when unmounted mid-chunking", () => {
    const remainingTimers = runUnmountTest();

    expect(remainingTimers).toBe(0);
  });

  it("clears classification cache via clearClassificationCache", () => {
    const [initialLabel, resetClassification] = runClearCacheTest();

    expect(initialLabel).toBe("Hand loss > Play gain");
    expect(resetClassification).toBeNull();
  });
});
