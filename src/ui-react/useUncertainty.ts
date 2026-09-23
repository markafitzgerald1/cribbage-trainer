import { useEffect, useState } from "react";
import { type Uncertainty } from "../game/uncertaintySidecar";
import { type UncertaintySource } from "../game/uncertaintyLoader";

/*
 * Started only once the recommendation is already on screen. The two sidecars
 * are roughly 1.2 MB and 0.3 MB against the 2.7 MB of means the first
 * recommendation needs up front, and nothing either carries changes what that
 * recommendation says - they only annotate how much of a figure's last digit
 * is simulation noise. Fetching them alongside the means would delay every
 * answer to decorate one.
 *
 * The seed and the load come from one source, so an injected source is the
 * only thing this hook can show. The seed matters because the analysis is
 * taken off screen whenever a discard is incomplete and mounted again after:
 * without it every new hand would render the figure as absent and fill it in.
 *
 * `source` is an effect dependency, so callers pass a stable object - the
 * same contract the table loader props already carry.
 */
export const useUncertainty = (
  areResultsOnScreen: boolean,
  source: UncertaintySource,
): Uncertainty | null => {
  const [uncertainty, setUncertainty] = useState(source.getUncertaintySync);

  useEffect(() => {
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
    };

    if (areResultsOnScreen) {
      // An injected source may reject where the shipped one resolves null; both mean unavailable.
      source.loadUncertainty().then(applyLoaded, () => {
        applyLoaded(null);
      });
    }
  }, [areResultsOnScreen, source]);

  return uncertainty;
};

export interface SidecarUncertainties {
  readonly crib: Uncertainty | null;
  readonly play: Uncertainty | null;
}

/*
 * Both sidecars, on the same trigger. They are separate documents and
 * separate build chunks, so each loads on its own; pairing them here is only
 * so the analysis table reads one value rather than tracking two.
 */
export const useSidecarUncertainties = (
  areResultsOnScreen: boolean,
  cribSource: UncertaintySource,
  playSource: UncertaintySource,
): SidecarUncertainties => ({
  crib: useUncertainty(areResultsOnScreen, cribSource),
  play: useUncertainty(areResultsOnScreen, playSource),
});
