import {
  type ExpectedTables,
  type LoadCribTable,
  type LoadPlayTable,
  loadExpectedTables,
  readSynchronousExpectedTables,
} from "./expectedTables";
import { useCallback, useEffect, useState } from "react";

export interface ExpectedTablesState {
  readonly handleRetry: () => void;
  readonly loadError: boolean;
  readonly tables: ExpectedTables | null;
}

/*
 * The means both halves of the recommendation need, and the only load whose
 * failure the reader has to be told about: without these there is no ranked
 * analysis to show at all.
 */
const retryListeners = new Set<() => void>();

/*
 * A retry from any consumer is a retry for all of them: the loaders are shared
 * and memoized, so one that recovers leaves every other instance's latched
 * failure stale.
 */
export const useExpectedTables = (
  loadCribTable: LoadCribTable,
  loadPlayTable: LoadPlayTable,
): ExpectedTablesState => {
  const [tables, setTables] = useState(readSynchronousExpectedTables);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    if (!tables && !loadError) {
      loadExpectedTables(loadCribTable, loadPlayTable)
        .then(setTables)
        .catch(() => {
          setLoadError(true);
        });
    }
  }, [loadCribTable, loadError, loadPlayTable, retryCount, tables]);

  const reset = useCallback(() => {
    setLoadError(false);
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    retryListeners.add(reset);
    return () => {
      retryListeners.delete(reset);
    };
  }, [reset]);

  const handleRetry = useCallback(() => {
    for (const listener of retryListeners) {
      listener();
    }
  }, []);

  return { handleRetry, loadError, tables };
};
