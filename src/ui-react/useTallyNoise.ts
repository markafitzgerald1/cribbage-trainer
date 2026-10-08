import {
  type DiscardTallySummary,
  type StoredTally,
  isSameLocalDay,
  readTallyForDisplay,
} from "../ui/discardTally";
import { type NoiseVerdictSources, useNoiseVerdicts } from "./useNoiseVerdicts";
import { buildMistakeQueue } from "../ui/mistakeQueue";
import { countWithinNoise } from "../ui/noiseVerdicts";
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
  {
    hasShownRecommendation,
    ...sources
  }: NoiseVerdictSources & { readonly hasShownRecommendation: boolean },
) => {
  const { readAt, stored } = readingOf(summary);
  const tally = injectedTally ?? stored;
  const { isWaiting, recomputedLosses, withinNoise } = useNoiseVerdicts(
    tally.records,
    sources,
    hasShownRecommendation,
  );
  return useMemo(() => {
    const today = tally.records.filter((record) =>
      isSameLocalDay(record.at, readAt),
    );
    return {
      hasMistakes: buildMistakeQueue(tally, withinNoise).length > 0,
      isWaiting,
      // Option B (#774): a within-noise decision counts neither as a best choice nor against one.
      judgedDecisions:
        summary.decisions - countWithinNoise(tally.records, withinNoise),
      judgedTodayDecisions:
        summary.todayDecisions - countWithinNoise(today, withinNoise),
      recomputedLosses,
      withinNoise,
    };
  }, [isWaiting, readAt, recomputedLosses, summary, tally, withinNoise]);
};
