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
import { useNoiseVerdicts } from "./useNoiseVerdicts";

const WAIT = { timeout: 8000 };

const noisy = settledSource(NOISE_STANDARD_ERROR);

const preloadTables = (): void => {
  cribLoader.setTableSync(expectedCribPointsTable);
  playLoader.setTableSync(expectedPlayPointsTable);
};

const renderVerdicts = (
  records: readonly DiscardDecisionRecord[],
  crib: UncertaintySource = noisy,
) =>
  renderHook(
    ({ history }) =>
      useNoiseVerdicts(history, { cribSource: crib, playSource: noisy }),
    { initialProps: { history: records } },
  );

const settledVerdicts = async (
  rendered: ReturnType<typeof renderVerdicts>,
): Promise<ReadonlySet<string>> => {
  await waitFor(() => {
    expect(rendered.result.current).not.toBeNull();
  }, WAIT);
  return rendered.result.current as ReadonlySet<string>;
};

const handsJudgedAcrossARerender = async (): Promise<readonly string[]> => {
  preloadTables();
  const spy = jest.spyOn(noiseVerdicts, "isRecordedDiscardWithinNoise");
  try {
    const rendered = renderVerdicts([WITHIN_NOISE_RECORD]);
    await settledVerdicts(rendered);
    rendered.rerender({ history: [WITHIN_NOISE_RECORD, MISTAKE_RECORD] });
    await settledVerdicts(rendered);
    return spy.mock.calls.map(([record]) => record.handKey);
  } finally {
    spy.mockRestore();
  }
};

const verdictsWithoutTables = async (): Promise<ReadonlySet<string>> => {
  cribLoader.setTableSync(null);
  const spy = jest
    .spyOn(cribLoader, "loadTable")
    .mockRejectedValueOnce(new Error("offline"));
  try {
    return await settledVerdicts(renderVerdicts([WITHIN_NOISE_RECORD]));
  } finally {
    spy.mockRestore();
  }
};

// Runs out the settle wait on fake timers, then delivers the crib document late.
const verdictsAfterALateDocument =
  async (): Promise<ReadonlySet<string> | null> => {
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

describe("useNoiseVerdicts", () => {
  it("has nothing to judge, and loads no sidecar, without a sub-optimal decision", () => {
    const load = jest.fn(() => Promise.resolve(null));
    const { result } = renderVerdicts([OPTIMAL_RECORD], {
      getUncertaintySync: () => null,
      loadUncertainty: load,
    });

    expect(result.current).toStrictEqual(new Set());
    expect(load).not.toHaveBeenCalled();
  });

  it("waits, then names the within-noise decision alone", async () => {
    preloadTables();
    const rendered = renderVerdicts([WITHIN_NOISE_RECORD, MISTAKE_RECORD]);

    expect(rendered.result.current).toBeNull();
    expect([...(await settledVerdicts(rendered))]).toStrictEqual([
      noiseVerdicts.noiseVerdictKey(WITHIN_NOISE_RECORD),
    ]);
  });

  it("judges only the decision a re-render adds", async () => {
    await expect(handsJudgedAcrossARerender()).resolves.toStrictEqual([
      WITHIN_NOISE_RECORD.handKey,
      MISTAKE_RECORD.handKey,
    ]);
  });

  it("keeps every exact verdict when the tables cannot load", async () => {
    await expect(verdictsWithoutTables()).resolves.toBe(noiseVerdicts.NO_NOISE);
  });

  it("keeps every exact verdict once the settle wait times out, even when the document lands after", async () => {
    await expect(verdictsAfterALateDocument()).resolves.toBe(
      noiseVerdicts.NO_NOISE,
    );
  });
});
