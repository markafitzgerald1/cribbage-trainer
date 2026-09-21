import { useEffect, useState } from "react";
import { type CribUncertainty } from "../game/cribUncertainty";

/*
 * Started only once the recommendation is already on screen. The sidecar is
 * roughly 1.2 MB against the 2.7 MB of means the first recommendation needs
 * up front, and nothing it carries changes what that recommendation says -
 * it only annotates how much of the crib average's last digit is simulation
 * noise. Fetching it alongside the means would delay every answer to
 * decorate one.
 */
export const useCribUncertainty = (
  areResultsOnScreen: boolean,
  loadUncertainty: () => Promise<CribUncertainty | null>,
): CribUncertainty | null => {
  const [uncertainty, setUncertainty] = useState<CribUncertainty | null>(null);

  useEffect(() => {
    if (areResultsOnScreen) {
      // Resolves to null rather than rejecting when the sidecar is unreachable or rejected.
      loadUncertainty().then(setUncertainty, () => {
        /*
         * The shipped loader resolves null instead of rejecting, but the
         * loader is an injectable prop and a caller's may reject. Both mean
         * the same thing: no bound, and a recommendation unaffected by that.
         */
        setUncertainty(null);
      });
    }
  }, [areResultsOnScreen, loadUncertainty]);

  return uncertainty;
};
