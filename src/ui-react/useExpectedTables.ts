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

  const handleRetry = useCallback(() => {
    setLoadError(false);
    setRetryCount((prev) => prev + 1);
  }, []);

  return { handleRetry, loadError, tables };
};
