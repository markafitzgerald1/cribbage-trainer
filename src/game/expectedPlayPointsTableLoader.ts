import { type ExpectedPlayPointsTable } from "./expectedPlayPoints";
import { createExpectedPointsTableLoader } from "./expectedPointsTableLoader";

const loader = createExpectedPointsTableLoader<ExpectedPlayPointsTable>(
  () => import("./expectedPlayPointsTable.json"),
);

export const { getTableSync, loadTable, setTableSync } = loader;
