import { useEffect, useState } from "react";
import { type CribUncertainty } from "../game/cribUncertainty";
import { type CribUncertaintySource } from "../game/cribUncertaintyLoader";

/*
 * Started only once the recommendation is already on screen. The sidecar is
 * roughly 1.2 MB against the 2.7 MB of means the first recommendation needs
 * up front, and nothing it carries changes what that recommendation says -
 * it only annotates how much of the crib average's last digit is simulation
 * noise. Fetching it alongside the means would delay every answer to
 * decorate one.
 *
 * The seed and the load come from one source, so an injected source is the
 * only thing this hook can show. The seed matters because the analysis is
 * taken off screen whenever a discard is incomplete and mounted again after:
 * without it every new hand would render the bound as absent and fill it in.
 *
 * `source` is an effect dependency, so callers pass a stable object - the
 * same contract the table loader props already carry.
 */
export const useCribUncertainty = (
  areResultsOnScreen: boolean,
  source: CribUncertaintySource,
): CribUncertainty | null => {
  const [uncertainty, setUncertainty] = useState(source.getCribUncertaintySync);

  useEffect(() => {
    const applyLoaded = (loaded: CribUncertainty | null): void => {
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
      source.loadCribUncertainty().then(applyLoaded, () => {
        applyLoaded(null);
      });
    }
  }, [areResultsOnScreen, source]);

  return uncertainty;
};
