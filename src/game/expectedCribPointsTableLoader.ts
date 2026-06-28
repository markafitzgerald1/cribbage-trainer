import { type ExpectedCribPointsTable } from "./expectedCribPoints";
import { createExpectedPointsTableLoader } from "./expectedPointsTableLoader";

const loader = createExpectedPointsTableLoader<ExpectedCribPointsTable>(
  () => import("./expectedCribPointsTable.json"),
);

export const { getTableSync, loadTable, setTableSync } = loader;
