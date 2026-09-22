import { type CribUncertainty, parseCribUncertainty } from "./cribUncertainty";
import { createExpectedPointsTableLoader } from "./expectedPointsTableLoader";

interface ImportedDocument {
  readonly default: unknown;
}

/*
 * What a consumer reads. Both halves come from one object on purpose: a
 * component seeded from one source and loaded from another would keep showing
 * whatever the first had cached, which is precisely the stale-injection
 * hazard this pairing removes.
 */
export interface CribUncertaintySource {
  readonly getCribUncertaintySync: () => CribUncertainty | null;
  readonly loadCribUncertainty: () => Promise<CribUncertainty | null>;
}

export interface CribUncertaintyLoader extends CribUncertaintySource {
  readonly setCribUncertaintySync: (document: unknown) => void;
}

/*
 * A factory rather than a bare module singleton so the rejected-import path
 * is reachable from a test: the shipped loader below imports a real file that
 * cannot be made to fail. Validation is memoized separately from the import
 * because parsing walks every published record, and the underlying loader
 * caches only the raw document.
 */
export const createCribUncertaintyLoader = (
  importDocument: () => Promise<ImportedDocument>,
): CribUncertaintyLoader => {
  const loader = createExpectedPointsTableLoader<unknown>(importDocument);
  const cached: { value: CribUncertainty | null } = { value: null };
  let parsed: Promise<CribUncertainty | null> | null = null;

  const remember = (value: CribUncertainty | null): CribUncertainty | null => {
    cached.value = value;
    return value;
  };

  const loadCribUncertainty = (): Promise<CribUncertainty | null> => {
    /*
     * A failed fetch resolves to null rather than rejecting: an unreachable
     * sidecar is an unavailable capability, and the recommendation it
     * accompanies is complete without it.
     */
    parsed ??= loader
      .loadTable()
      .then(parseCribUncertainty, () => null)
      .then(remember);
    return parsed;
  };

  /*
   * Mirrors the means loaders' `getTableSync`: once the document has been
   * read, a later mount seeds from it rather than transitioning through null,
   * which is what lets a test preload the sidecar the way it preloads a table.
   */
  const getCribUncertaintySync = (): CribUncertainty | null => cached.value;

  /*
   * Null resets rather than injects, matching the means loaders' own
   * `setTableSync(null)`: it clears the cache and lets the next call import
   * again. Anything else is a document to read now, so a caller that preloads
   * one gets a mount with no null to transition through.
   */
  const setCribUncertaintySync = (document: unknown): void => {
    loader.setTableSync(document);
    cached.value = null;
    parsed =
      document === null
        ? null
        : Promise.resolve(remember(parseCribUncertainty(document)));
  };

  return {
    getCribUncertaintySync,
    loadCribUncertainty,
    setCribUncertaintySync,
  };
};

export const shippedCribUncertainty: CribUncertaintyLoader =
  createCribUncertaintyLoader(
    () => import("./expectedCribPointsUncertainty.json"),
  );

export const { loadCribUncertainty, setCribUncertaintySync } =
  shippedCribUncertainty;
