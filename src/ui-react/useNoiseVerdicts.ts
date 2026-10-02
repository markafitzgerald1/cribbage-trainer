import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import {
  NO_NOISE,
  isNoiseCandidate,
  isRecordedDiscardWithinNoise,
  noiseVerdictKey,
} from "../ui/noiseVerdicts";
import { type SidecarSources, useSidecarUncertainties } from "./useUncertainty";
import { useEffect, useMemo, useState } from "react";
import type { DiscardDecisionRecord } from "../ui/discardDecisionRecord";
import { useExpectedTables } from "./useExpectedTables";

export type NoiseVerdictSources = Pick<
  SidecarSources,
  "cribSource" | "playSource"
>;

/*
 * The keys of the recorded decisions whose loss is within simulation noise,
 * recomputed from each stored hand and discard by the caption's comparison.
 * Null while waiting on the tables, the sidecars or the judging; the empty set
 * when any of those is unavailable or the settle wait timed out, so every
 * exact verdict stands. One settle wait covers the whole history, so a
 * timeout keeps it exact for the session rather than flipping on a late load.
 */
export const useNoiseVerdicts = (
  records: readonly DiscardDecisionRecord[],
  { cribSource, playSource }: NoiseVerdictSources,
): ReadonlySet<string> | null => {
  const candidates = useMemo(() => records.filter(isNoiseCandidate), [records]);
  const hasCandidates = candidates.length > 0;
  const { loadError, tables } = useExpectedTables(
    cribLoader.loadTable,
    playLoader.loadTable,
  );
  const [verdicts, setVerdicts] = useState<ReadonlyMap<string, boolean>>(
    () => new Map(),
  );
  const { crib, isSettled, isVerdictTimedOut, play } = useSidecarUncertainties({
    areResultsOnScreen: hasCandidates,
    cribSource,
    playSource,
    shouldTrackSettled: hasCandidates,
    verdictKey: "history",
  });
  const sidecars = useMemo(
    () =>
      crib === null || play === null || isVerdictTimedOut
        ? null
        : { crib, play },
    [crib, isVerdictTimedOut, play],
  );

  // A hand costs a fifteen-discard analysis, about 20ms on a desktop, so one is judged per task.
  useEffect(() => {
    const next =
      candidates.find((record) => !verdicts.has(noiseVerdictKey(record))) ??
      null;
    if (tables === null || sidecars === null || next === null) {
      return () => {
        // Nothing is being judged.
      };
    }
    const timer = setTimeout(() => {
      setVerdicts((judged) =>
        new Map(judged).set(
          noiseVerdictKey(next),
          isRecordedDiscardWithinNoise(next, tables, sidecars),
        ),
      );
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, [candidates, sidecars, tables, verdicts]);

  const isUnavailable = loadError || (isSettled && sidecars === null);
  return useMemo(() => {
    if (isUnavailable) {
      return NO_NOISE;
    }
    const keys = candidates.map(noiseVerdictKey);
    return keys.every((key) => verdicts.has(key))
      ? new Set(keys.filter((key) => verdicts.get(key)))
      : null;
  }, [candidates, isUnavailable, verdicts]);
};
