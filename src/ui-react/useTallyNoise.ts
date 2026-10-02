import {
  type DiscardTallySummary,
  type StoredTally,
  isSameLocalDay,
  readTallyForDisplay,
} from "../ui/discardTally";
import { NO_NOISE, countWithinNoise } from "../ui/noiseVerdicts";
import { type NoiseVerdictSources, useNoiseVerdicts } from "./useNoiseVerdicts";
import { buildMistakeQueue } from "../ui/mistakeQueue";
import { useMemo } from "react";

/*
 * A new summary arrives each time this tab records something, so it names the
 * stored tally it came from: one read per summary spares the re-renders the
 * verdicts cause from re-parsing storage, and fixes when "today" is measured.
 */
const readings = new WeakMap<
  DiscardTallySummary,
  { readonly readAt: number; readonly stored: StoredTally }
>();

const readingOf = (summary: DiscardTallySummary) => {
  const reading = readings.get(summary) ?? {
    readAt: Date.now(),
    stored: readTallyForDisplay(),
  };
  readings.set(summary, reading);
  return reading;
};

export const useTallyNoise = (
  summary: DiscardTallySummary,
  injectedTally: StoredTally | null,
  sources: NoiseVerdictSources,
) => {
  const { readAt, stored } = readingOf(summary);
  const tally = injectedTally ?? stored;
  const verdicts = useNoiseVerdicts(tally.records, sources);
  return useMemo(() => {
    // Every surface shows the exact verdict until the noise verdicts settle.
    const withinNoise = verdicts ?? NO_NOISE;
    const today = tally.records.filter((record) =>
      isSameLocalDay(record.at, readAt),
    );
    return {
      hasMistakes: buildMistakeQueue(tally, withinNoise).length > 0,
      isJudging: verdicts === null,
      // Option B (#774): a within-noise decision counts neither as a best choice nor against one.
      judgedDecisions:
        summary.decisions - countWithinNoise(tally.records, withinNoise),
      judgedTodayDecisions:
        summary.todayDecisions - countWithinNoise(today, withinNoise),
      withinNoise,
    };
  }, [readAt, summary, tally, verdicts]);
};
