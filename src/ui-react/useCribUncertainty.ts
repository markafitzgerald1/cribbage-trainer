import { useEffect, useState } from "react";
import { type CribUncertainty } from "../game/cribUncertainty";
import { getCribUncertaintySync } from "../game/cribUncertaintyLoader";

/*
 * Started only once the recommendation is already on screen. The sidecar is
 * roughly 1.2 MB against the 2.7 MB of means the first recommendation needs
 * up front, and nothing it carries changes what that recommendation says -
 * it only annotates how much of the crib average's last digit is simulation
 * noise. Fetching it alongside the means would delay every answer to
 * decorate one.
 *
 * The synchronous seed reads the shipped loader's own cache, the way
 * `useExpectedTables` reads `getTableSync`, so a second mount does not
 * transition through null again. A caller injecting `loadUncertainty` is
 * therefore pairing its loader with the shipped cache; that cache is empty
 * unless something has actually run the shipped loader.
 */
export const useCribUncertainty = (
  areResultsOnScreen: boolean,
  loadUncertainty: () => Promise<CribUncertainty | null>,
): CribUncertainty | null => {
  const [uncertainty, setUncertainty] = useState(getCribUncertaintySync);

  useEffect(() => {
    const applyLoaded = (loaded: CribUncertainty | null): void => {
      /*
       * Only an available sidecar changes anything. Null is already the
       * state, so setting it again would be a re-render that says nothing -
       * and, in a test that does not await this load, an update outside
       * `act` for a value the component never shows.
       */
      if (loaded !== null) {
        setUncertainty(loaded);
      }
    };

    if (areResultsOnScreen) {
      // An injected loader may reject where the shipped one resolves null; both mean unavailable.
      loadUncertainty().then(applyLoaded, () => {
        applyLoaded(null);
      });
    }
  }, [areResultsOnScreen, loadUncertainty]);

  return uncertainty;
};
