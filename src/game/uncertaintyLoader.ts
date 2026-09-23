import {
  type Uncertainty,
  type UncertaintyContract,
  parseUncertaintySidecar,
} from "./uncertaintySidecar";
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
export interface UncertaintySource {
  readonly getUncertaintySync: () => Uncertainty | null;
  readonly loadUncertainty: () => Promise<Uncertainty | null>;
}

export interface UncertaintyLoader extends UncertaintySource {
  readonly setUncertaintySync: (document: unknown) => void;
}

/*
 * A factory rather than a bare module singleton so the rejected-import path
 * is reachable from a test: the shipped loaders import real files that cannot
 * be made to fail. Validation is memoized separately from the import because
 * parsing walks every published record, and the underlying loader caches only
 * the raw document.
 *
 * One factory serves both published sidecars: the schema is one document
 * shape, and the contract is the only thing that differs between them.
 */
export const createUncertaintyLoader = (
  importDocument: () => Promise<ImportedDocument>,
  contract: UncertaintyContract,
): UncertaintyLoader => {
  const loader = createExpectedPointsTableLoader<unknown>(importDocument);
  const cached: { value: Uncertainty | null } = { value: null };
  let parsed: Promise<Uncertainty | null> | null = null;

  const parse = (document: unknown): Uncertainty | null =>
    parseUncertaintySidecar(document, contract);

  const remember = (value: Uncertainty | null): Uncertainty | null => {
    cached.value = value;
    return value;
  };

  const loadUncertainty = (): Promise<Uncertainty | null> => {
    /*
     * A failed fetch resolves to null rather than rejecting: an unreachable
     * sidecar is an unavailable capability, and the recommendation it
     * accompanies is complete without it.
     */
    parsed ??= loader
      .loadTable()
      .then(parse, () => null)
      .then(remember);
    return parsed;
  };

  /*
   * Mirrors the means loaders' `getTableSync`: once the document has been
   * read, a later mount seeds from it rather than transitioning through null,
   * which is what lets a test preload a sidecar the way it preloads a table.
   */
  const getUncertaintySync = (): Uncertainty | null => cached.value;

  /*
   * Null resets rather than injects, matching the means loaders' own
   * `setTableSync(null)`: it clears the cache and lets the next call import
   * again. Anything else is a document to read now, so a caller that preloads
   * one gets a mount with no null to transition through.
   */
  const setUncertaintySync = (document: unknown): void => {
    loader.setTableSync(document);
    cached.value = null;
    parsed =
      document === null ? null : Promise.resolve(remember(parse(document)));
  };

  return { getUncertaintySync, loadUncertainty, setUncertaintySync };
};
