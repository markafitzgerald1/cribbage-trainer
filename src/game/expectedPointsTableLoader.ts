interface ImportedTable {
  readonly default: unknown;
}

export interface ExpectedPointsTableLoader<T> {
  readonly getTableSync: () => T | null;
  readonly loadTable: () => Promise<T>;
  readonly setTableSync: (newTable: T | null) => void;
}

export const createExpectedPointsTableLoader =
  function createExpectedPointsTableLoader<T>(
    importTable: () => Promise<ImportedTable>,
  ): ExpectedPointsTableLoader<T> {
    let table: T | null = null;
    let loadPromise: Promise<T> | null = null;

    const loadTable = (): Promise<T> => {
      if (table !== null) {
        return Promise.resolve(table);
      }
      if (!loadPromise) {
        loadPromise = importTable()
          .then((module) => {
            table = module.default as T;
            return table;
          })
          .catch(
            /* istanbul ignore next */
            (error) => {
              loadPromise = null;
              throw error as Error;
            },
          );
      }
      return loadPromise;
    };

    const getTableSync = (): T | null => table;

    const setTableSync = (newTable: T | null): void => {
      table = newTable;
      loadPromise = newTable === null ? null : Promise.resolve(newTable);
    };

    return { getTableSync, loadTable, setTableSync };
  };
