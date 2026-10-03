import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import {
  NO_NOISE,
  type NoiseCandidate,
  type NoiseSidecars,
  type NoiseTables,
  type RecordedVerdict,
  isNoiseCandidate,
  judgeRecordedDiscard,
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

export interface NoiseVerdicts {
  // True only while the tables and sidecars load, which the settle wait bounds; never for the judging itself.
  readonly isWaiting: boolean;
  readonly recomputedLosses: ReadonlyMap<string, number>;
  readonly withinNoise: ReadonlySet<string>;
}

const NO_VERDICTS: NoiseVerdicts = {
  isWaiting: false,
  recomputedLosses: new Map(),
  withinNoise: NO_NOISE,
};

type JudgedVerdicts = ReadonlyMap<string, RecordedVerdict | null>;

/*
 * A hand costs a fifteen-discard analysis, about 13 ms in desktop Chromium
 * and four times that at 4x CPU throttling, so a long history is judged in
 * slices of about one frame's work, yielding to the event loop between them.
 */
const SLICE_BUDGET_MS = 8;

const judgeSlice = (
  pending: readonly NoiseCandidate[],
  tables: NoiseTables,
  sidecars: NoiseSidecars,
): JudgedVerdicts => {
  const started = performance.now();
  const slice = new Map<string, RecordedVerdict | null>();
  for (const record of pending) {
    slice.set(
      noiseVerdictKey(record),
      judgeRecordedDiscard(record, tables, sidecars),
    );
    if (performance.now() - started >= SLICE_BUDGET_MS) {
      break;
    }
  }
  return slice;
};

const verdictsOf = (judged: JudgedVerdicts, isWaiting: boolean) => {
  const withinNoise = new Set<string>();
  const recomputedLosses = new Map<string, number>();
  for (const [key, verdict] of judged) {
    if (verdict !== null) {
      recomputedLosses.set(key, verdict.loss);
      if (verdict.isWithinNoise) {
        withinNoise.add(key);
      }
    }
  }
  return { isWaiting, recomputedLosses, withinNoise };
};

/*
 * The recorded decisions judged so far against simulation noise, recomputed
 * from each stored hand and discard by the caption's comparison. A decision
 * not judged yet keeps its exact verdict, and one judged keeps its verdict
 * for the mount. Nothing loads until a recommendation has been on screen,
 * the sidecars' deferral rule; unavailable tables or sidecars, or a timed-out
 * settle wait, leave every exact verdict standing for the session.
 */
export const useNoiseVerdicts = (
  records: readonly DiscardDecisionRecord[],
  { cribSource, playSource }: NoiseVerdictSources,
  hasShownRecommendation: boolean,
): NoiseVerdicts => {
  // Newest first, so today's figures and the latest chart markers settle before older history.
  const candidates = useMemo(
    () => records.filter(isNoiseCandidate).reverse(),
    [records],
  );
  const shouldJudge = hasShownRecommendation && candidates.length > 0;
  const { loadError, tables } = useExpectedTables(
    cribLoader.loadTable,
    playLoader.loadTable,
  );
  const [judged, setJudged] = useState<JudgedVerdicts>(() => new Map());
  const { crib, isSettled, isVerdictTimedOut, play } = useSidecarUncertainties({
    areResultsOnScreen: shouldJudge,
    cribSource,
    playSource,
    shouldTrackSettled: shouldJudge,
    verdictKey: "history",
  });
  const sidecars = useMemo(
    () =>
      crib === null || play === null || isVerdictTimedOut
        ? null
        : { crib, play },
    [crib, isVerdictTimedOut, play],
  );

  // One slice per run: each commit re-runs this, and a change of input or an unmount cancels the slice still queued.
  useEffect(() => {
    const pending = [
      ...new Map(candidates.map((record) => [noiseVerdictKey(record), record])),
    ]
      .filter(([key]) => !judged.has(key))
      .map(([, record]) => record);
    if (
      !shouldJudge ||
      tables === null ||
      sidecars === null ||
      pending.length === 0
    ) {
      return () => {
        // Nothing is being judged.
      };
    }
    const timer = setTimeout(() => {
      const slice = judgeSlice(pending, tables, sidecars);
      setJudged((previous) => new Map([...previous, ...slice]));
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, [candidates, judged, shouldJudge, sidecars, tables]);

  const isUnavailable = loadError || (isSettled && sidecars === null);
  const isWaiting = shouldJudge && (tables === null || sidecars === null);
  return useMemo(
    () => (isUnavailable ? NO_VERDICTS : verdictsOf(judged, isWaiting)),
    [isUnavailable, isWaiting, judged],
  );
};
