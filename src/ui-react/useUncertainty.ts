import { useEffect, useMemo, useRef, useState } from "react";
import { type Uncertainty } from "../game/uncertaintySidecar";
import { type UncertaintySource } from "../game/uncertaintyLoader";

/*
 * Started only once the recommendation is already on screen. The two sidecars
 * are roughly 1.2 MB and 0.3 MB against the 2.7 MB of means the first
 * recommendation needs up front, and nothing either carries changes which
 * discard is recommended. Since #774 they do decide whether a chosen discard's
 * loss is flagged or treated as noise, so that verdict waits for them rather
 * than the recommendation: fetching them alongside the means would delay every
 * answer for the sake of one clause.
 *
 * The seed and the load come from one source, so an injected source is the
 * only thing this hook can show. The seed matters because the analysis is
 * taken off screen whenever a discard is incomplete and mounted again after:
 * without it every new hand would render the figure as absent and fill it in.
 *
 * `source` is an effect dependency, so callers pass a stable object - the
 * same contract the table loader props already carry.
 */
export const SIDECAR_SETTLE_TIMEOUT_MS = 5000;

export interface LoadedUncertainty {
  /*
   * True once the load has finished either way, or at once when the source
   * already held a document. Null uncertainty alone cannot say this: it means
   * both "still loading" and "unavailable", and a verdict that waits for the
   * sidecars (#774) has to tell the two apart.
   */
  readonly isSettled: boolean;
  readonly uncertainty: Uncertainty | null;
}

/*
 * `shouldTrackSettled` is true only while a verdict is waiting on the
 * sidecars (a chosen discard with a positive loss). Recording settlement costs
 * a re-render, so it is skipped when nothing reads it; when the flag turns on
 * later, the effect runs again and the loader's cached promise settles it.
 */
export const useUncertainty = (
  areResultsOnScreen: boolean,
  source: UncertaintySource,
  shouldTrackSettled: boolean,
): LoadedUncertainty => {
  const [uncertainty, setUncertainty] = useState(source.getUncertaintySync);
  const [isSettled, setIsSettled] = useState(() => uncertainty !== null);
  const isSettledRef = useRef(isSettled);

  useEffect(() => {
    const settle = (): void => {
      // Setting a flag already set would be a re-render that says nothing, and an update outside `act` in any test that does not await it.
      if (shouldTrackSettled && !isSettledRef.current) {
        isSettledRef.current = true;
        setIsSettled(true);
      }
    };
    const applyLoaded = (loaded: Uncertainty | null): void => {
      /*
       * Null cannot mean "clear what the seed gave you" now that both come
       * from one source: it means the source still has nothing. Setting the
       * null already held would be a re-render that says nothing - and, in a
       * test that does not await this load, an update outside `act`.
       */
      if (loaded !== null) {
        setUncertainty(loaded);
      }
      settle();
    };

    if (areResultsOnScreen) {
      // An injected source may reject where the shipped one resolves null; both mean unavailable.
      source.loadUncertainty().then(applyLoaded, () => {
        applyLoaded(null);
      });
    }
  }, [areResultsOnScreen, shouldTrackSettled, source]);

  return { isSettled, uncertainty };
};

export interface SidecarUncertainties {
  readonly crib: Uncertainty | null;
  readonly isSettled: boolean;
  /*
   * True when this analysis's verdict stopped waiting at the timeout. Its
   * verdict is then given without the sidecars and stays that way even if a
   * document arrives later, so it never flips on screen; the documents
   * themselves are still applied, so the per-row figures fill in.
   */
  readonly isVerdictTimedOut: boolean;
  readonly play: Uncertainty | null;
}

/*
 * Both sidecars, on the same trigger. They are separate documents and
 * separate build chunks, so each loads on its own; pairing them here is only
 * so the analysis table reads one value rather than tracking two.
 */
export interface SidecarSources {
  readonly areResultsOnScreen: boolean;
  readonly cribSource: UncertaintySource;
  readonly playSource: UncertaintySource;
  readonly shouldTrackSettled: boolean;
  // Identifies the analysis a verdict belongs to; Back and Forward swap it while the component stays mounted.
  readonly verdictKey: object;
}

export const useSidecarUncertainties = ({
  areResultsOnScreen,
  cribSource,
  playSource,
  shouldTrackSettled,
  verdictKey,
}: SidecarSources): SidecarUncertainties => {
  const crib = useUncertainty(
    areResultsOnScreen,
    cribSource,
    shouldTrackSettled,
  );
  const play = useUncertainty(
    areResultsOnScreen,
    playSource,
    shouldTrackSettled,
  );
  const [timedOutKey, setTimedOutKey] = useState<object | null>(null);
  const haveBothSettled = crib.isSettled && play.isSettled;

  useEffect(() => {
    if (!areResultsOnScreen || !shouldTrackSettled || haveBothSettled) {
      return () => {
        // Nothing is waiting, so there is no timer to clear.
      };
    }
    /*
     * A stalled load - neither resolved nor rejected, as a hung chunk fetch
     * on a poor phone connection can be - must not withhold a verdict
     * forever. After this long the verdict for this analysis is given as if
     * the sidecars were unavailable. The figure is a patience limit for a
     * network request, not a statistical input.
     */
    const timer = setTimeout(() => {
      setTimedOutKey(verdictKey);
    }, SIDECAR_SETTLE_TIMEOUT_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [areResultsOnScreen, haveBothSettled, shouldTrackSettled, verdictKey]);

  const isVerdictTimedOut = timedOutKey === verdictKey;
  const isSettled = haveBothSettled || isVerdictTimedOut;
  // Memoized because the verdict that consumes it recomputes on identity.
  return useMemo(
    () => ({
      crib: crib.uncertainty,
      isSettled,
      isVerdictTimedOut,
      play: play.uncertainty,
    }),
    [crib.uncertainty, isSettled, isVerdictTimedOut, play.uncertainty],
  );
};
