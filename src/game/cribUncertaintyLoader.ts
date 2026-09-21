import { type CribUncertainty, parseCribUncertainty } from "./cribUncertainty";
import { createExpectedPointsTableLoader } from "./expectedPointsTableLoader";

interface ImportedDocument {
  readonly default: unknown;
}

export interface CribUncertaintyLoader {
  readonly loadCribUncertainty: () => Promise<CribUncertainty | null>;
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
  let parsed: Promise<CribUncertainty | null> | null = null;

  const loadCribUncertainty = (): Promise<CribUncertainty | null> => {
    /*
     * A failed fetch resolves to null rather than rejecting: an unreachable
     * sidecar is an unavailable capability, and the recommendation it
     * accompanies is complete without it.
     */
    parsed ??= loader.loadTable().then(parseCribUncertainty, () => null);
    return parsed;
  };

  const setCribUncertaintySync = (document: unknown): void => {
    loader.setTableSync(document);
    parsed = null;
  };

  return { loadCribUncertainty, setCribUncertaintySync };
};

export const { loadCribUncertainty, setCribUncertaintySync } =
  createCribUncertaintyLoader(
    () => import("./expectedCribPointsUncertainty.json"),
  );
