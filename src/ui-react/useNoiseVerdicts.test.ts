import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as noiseVerdicts from "../ui/noiseVerdicts";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import {
  MISTAKE_RECORD,
  NOISE_STANDARD_ERROR,
  OPTIMAL_RECORD,
  WITHIN_NOISE_RECORD,
  settledSource,
} from "../ui/noiseVerdicts.test.common";
import { type NoiseVerdicts, useNoiseVerdicts } from "./useNoiseVerdicts";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import {
  expectedCribPointsTable,
  expectedPlayPointsTable,
} from "../analysis/analysis.test.common";
import type { DiscardDecisionRecord } from "../ui/discardDecisionRecord";
import { SIDECAR_SETTLE_TIMEOUT_MS } from "./useUncertainty";
import { type UncertaintySource } from "../game/uncertaintyLoader";
import { uniformUncertainty } from "../game/uncertaintySidecar.test.common";
import { useExpectedTables } from "./useExpectedTables";

const WAIT = { timeout: 8000 };

const noisy = settledSource(NOISE_STANDARD_ERROR);

const preloadTables = (): void => {
  cribLoader.setTableSync(expectedCribPointsTable);
  playLoader.setTableSync(expectedPlayPointsTable);
};

const renderVerdicts = (
  records: readonly DiscardDecisionRecord[],
  crib: UncertaintySource = noisy,
  shown = true,
) =>
  renderHook(
    ({ history, isShown }) =>
      useNoiseVerdicts(
        history,
        { cribSource: crib, playSource: noisy },
        isShown,
      ),
    { initialProps: { history: records, isShown: shown } },
  );

type Rendered = ReturnType<typeof renderVerdicts>;

const once = async (
  rendered: Rendered,
  read: (verdicts: NoiseVerdicts) => unknown,
  expected: unknown,
): Promise<NoiseVerdicts> => {
  await waitFor(() => {
    expect(read(rendered.result.current)).toBe(expected);
  }, WAIT);
  return rendered.result.current;
};

const judgedCount = (rendered: Rendered, count: number) =>
  once(rendered, (verdicts) => verdicts.recomputedLosses.size, count);

const notWaiting = (rendered: Rendered) =>
  once(rendered, (verdicts) => verdicts.isWaiting, false);

// Judges one decision, then adds a second that nobody has judged yet.
const addAfterJudging = async (): Promise<Rendered> => {
  preloadTables();
  const rendered = renderVerdicts([WITHIN_NOISE_RECORD]);
  await judgedCount(rendered, 1);
  rendered.rerender({
    history: [WITHIN_NOISE_RECORD, MISTAKE_RECORD],
    isShown: true,
  });
  return rendered;
};

const handsJudgedAcrossARerender = async (): Promise<readonly string[]> => {
  const spy = jest.spyOn(noiseVerdicts, "judgeRecordedDiscard");
  try {
    await judgedCount(await addAfterJudging(), 2);
    return spy.mock.calls.map(([record]) => record.handKey);
  } finally {
    spy.mockRestore();
  }
};

// The within-noise verdict right after a re-render adds a decision nobody has judged yet.
const verdictWhileANewDecisionWaits = async (): Promise<boolean> => {
  const rendered = await addAfterJudging();
  const isKept = rendered.result.current.withinNoise.has(
    noiseVerdicts.noiseVerdictKey(WITHIN_NOISE_RECORD),
  );
  await judgedCount(rendered, 2);
  return isKept;
};

const failFirstCribLoad = () => {
  cribLoader.setTableSync(null);
  playLoader.setTableSync(null);
  return jest
    .spyOn(cribLoader, "loadTable")
    .mockRejectedValueOnce(new Error("offline"));
};

const useAnalysisPanelTables = () =>
  useExpectedTables(cribLoader.loadTable, playLoader.loadTable);

const verdictsWithoutTables = async (): Promise<NoiseVerdicts> => {
  const spy = failFirstCribLoad();
  try {
    return await notWaiting(renderVerdicts([WITHIN_NOISE_RECORD]));
  } finally {
    spy.mockRestore();
  }
};

// The analysis panel's own table hook recovers after the first load failed.
const verdictsAfterAnotherHooksRetry = async (): Promise<Rendered> => {
  const spy = failFirstCribLoad().mockResolvedValue(expectedCribPointsTable);
  try {
    const history = renderVerdicts([WITHIN_NOISE_RECORD]);
    await notWaiting(history);
    const panel = renderHook(useAnalysisPanelTables);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      panel.result.current.handleRetry();
    });
    await waitFor(() => {
      expect(panel.result.current.tables).not.toBeNull();
    }, WAIT);
    return history;
  } finally {
    spy.mockRestore();
  }
};

// Runs out the settle wait on fake timers, then delivers the crib document late.
const verdictsAfterALateDocument = async (): Promise<NoiseVerdicts> => {
  preloadTables();
  jest.useFakeTimers();
  try {
    let release: (
      value: ReturnType<typeof uniformUncertainty>,
    ) => void = () => {
      // Replaced when the hook starts the load.
    };
    const rendered = renderVerdicts([WITHIN_NOISE_RECORD], {
      getUncertaintySync: () => null,
      loadUncertainty: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(SIDECAR_SETTLE_TIMEOUT_MS);
    });
    await act(async () => {
      release(uniformUncertainty(NOISE_STANDARD_ERROR));
      await jest.advanceTimersByTimeAsync(SIDECAR_SETTLE_TIMEOUT_MS);
    });
    return rendered.result.current;
  } finally {
    jest.useRealTimers();
  }
};

const sidecarLoadsBeforeAndAfterARecommendation = async (): Promise<
  readonly number[]
> => {
  preloadTables();
  const load = jest.fn(() =>
    Promise.resolve(uniformUncertainty(NOISE_STANDARD_ERROR)),
  );
  const rendered = renderVerdicts(
    [WITHIN_NOISE_RECORD],
    { getUncertaintySync: () => null, loadUncertainty: load },
    false,
  );
  await act(async () => {
    await Promise.resolve();
  });
  const before = load.mock.calls.length;
  rendered.rerender({ history: [WITHIN_NOISE_RECORD], isShown: true });
  await judgedCount(rendered, 1);
  return [before, load.mock.calls.length];
};

// Runs one queued task at a time, so each slice's work is counted on its own.
const runTasks = async (
  count: number,
  judged: () => number,
  counts: readonly number[] = [],
): Promise<readonly number[]> => {
  if (count === 0) {
    return counts;
  }
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
  return runTasks(count - 1, judged, [...counts, judged()]);
};

const HAND_COST_MS = 5;
const HANDS = 5;

/*
 * Each fake hand advances a fake clock by 5 ms against the 8 ms budget, so a
 * time-boxed slice holds two hands. Returns how many hands had been judged
 * after each task, the first one judged, and the count after an unmount
 * that cancels whatever was still queued.
 */
const judgingByTask = async (unmountAfter: number) => {
  preloadTables();
  jest.useFakeTimers({ doNotFake: ["performance"] });
  const clock = { now: 0 };
  const readClock = () => clock.now;
  const now = jest.spyOn(performance, "now").mockImplementation(readClock);
  const judge = jest
    .spyOn(noiseVerdicts, "judgeRecordedDiscard")
    .mockImplementation(() => {
      clock.now += HAND_COST_MS;
      return { isWithinNoise: false, loss: 1 };
    });
  try {
    const rendered = renderVerdicts(
      Array.from({ length: HANDS }, (_unused, index) => ({
        ...MISTAKE_RECORD,
        handKey: `hand ${index}`,
      })),
    );
    const judgedAfterEachTask = await runTasks(
      unmountAfter,
      () => judge.mock.calls.length,
    );
    rendered.unmount();
    await jest.advanceTimersByTimeAsync(0);
    return {
      afterUnmount: judge.mock.calls.length,
      first: judge.mock.calls[0]?.[0].handKey,
      judgedAfterEachTask,
    };
  } finally {
    judge.mockRestore();
    now.mockRestore();
    jest.useRealTimers();
  }
};

describe("useNoiseVerdicts", () => {
  it("has nothing to judge, and loads no sidecar, without a sub-optimal decision", () => {
    preloadTables();
    const load = jest.fn(() => Promise.resolve(null));
    const { result } = renderVerdicts([OPTIMAL_RECORD], {
      getUncertaintySync: () => null,
      loadUncertainty: load,
    });

    expect(result.current.withinNoise).toStrictEqual(new Set());
    expect(load).not.toHaveBeenCalled();
  });

  it("loads no sidecar until a recommendation has been on screen", async () => {
    await expect(
      sidecarLoadsBeforeAndAfterARecommendation(),
    ).resolves.toStrictEqual([0, 1]);
  });

  it("waits, then names the within-noise decision alone with both recomputed losses", async () => {
    preloadTables();
    const rendered = renderVerdicts([WITHIN_NOISE_RECORD, MISTAKE_RECORD]);

    expect(rendered.result.current.isWaiting).toBe(true);

    const { recomputedLosses, withinNoise } = await judgedCount(rendered, 2);

    expect([...withinNoise]).toStrictEqual([
      noiseVerdicts.noiseVerdictKey(WITHIN_NOISE_RECORD),
    ]);
    expect(
      recomputedLosses.get(noiseVerdicts.noiseVerdictKey(MISTAKE_RECORD)),
    ).toBeCloseTo(MISTAKE_RECORD.expectedPointsLoss, 4);
  });

  it("judges only the decision a re-render adds", async () => {
    await expect(handsJudgedAcrossARerender()).resolves.toStrictEqual([
      WITHIN_NOISE_RECORD.handKey,
      MISTAKE_RECORD.handKey,
    ]);
  });

  it("keeps a judged verdict while a newly added decision waits", async () => {
    await expect(verdictWhileANewDecisionWaits()).resolves.toBe(true);
  });

  it("judges an unreadable hand once, and gives it no verdict", async () => {
    preloadTables();
    const unreadable = { ...WITHIN_NOISE_RECORD, handKey: "not a hand" };
    // Newest, so it is judged before the readable one whose verdict ends the wait.
    const rendered = renderVerdicts([WITHIN_NOISE_RECORD, unreadable]);
    const { withinNoise } = await judgedCount(rendered, 1);

    expect(withinNoise.has(noiseVerdicts.noiseVerdictKey(unreadable))).toBe(
      false,
    );
  });

  it("keeps every exact verdict when the tables cannot load", async () => {
    await expect(verdictsWithoutTables()).resolves.toHaveProperty(
      "withinNoise",
      noiseVerdicts.NO_NOISE,
    );
  });

  it("judges the history once a retry from the analysis panel recovers the tables", async () => {
    await expect(
      judgedCount(await verdictsAfterAnotherHooksRetry(), 1),
    ).resolves.toHaveProperty("withinNoise.size", 1);
  });

  it("keeps every exact verdict once the settle wait times out, even when the document lands after", async () => {
    await expect(verdictsAfterALateDocument()).resolves.toHaveProperty(
      "withinNoise",
      noiseVerdicts.NO_NOISE,
    );
  });

  it("judges newest first in time-boxed tasks, never in one block", async () => {
    await expect(judgingByTask(HANDS)).resolves.toMatchObject({
      first: `hand ${HANDS - 1}`,
      judgedAfterEachTask: [0, 2, 4, 5, 5],
    });
  });

  it("stops judging when unmounted", async () => {
    await expect(judgingByTask(2)).resolves.toHaveProperty("afterUnmount", 2);
  });
});
