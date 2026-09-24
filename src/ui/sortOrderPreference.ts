import { parseSortParam, sortUrlValue } from "./urlAnalysisState";
import { SORT_ORDER_KEY_PREFIX } from "./sortOrderKeyPrefix";
import { SortOrder } from "./SortOrder";

/*
 * Scoped to the deployment that wrote it. A PR preview and production share
 * an origin — both are pages on the same host, differing only by path — and
 * localStorage is keyed by origin alone, so an unscoped key would let a
 * preview being tested write into the player's real preference, permanently.
 */
export const sortOrderKey = `${SORT_ORDER_KEY_PREFIX}${import.meta.env.BASE_URL}`;

export const readStoredSortOrder = (): SortOrder | null => {
  try {
    const raw = localStorage.getItem(sortOrderKey);
    return parseSortParam(raw);
  } catch {
    return null;
  }
};

export const storeSortOrder = (sortOrder: SortOrder): void => {
  try {
    localStorage.setItem(sortOrderKey, sortUrlValue(sortOrder));
  } catch {
    // Storage can throw in private modes or when blocked; a lost preference is harmless.
  }
};

export const clearStoredSortOrder = (): void => {
  try {
    localStorage.removeItem(sortOrderKey);
  } catch {
    // Storage can throw in private modes or when blocked; an uncleared preference is harmless.
  }
};
