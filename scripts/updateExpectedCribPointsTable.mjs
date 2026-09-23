import {
  CRIB_ASSETS,
  downloadMeansAndUncertainty,
  reportFailure,
  writeTablesAtomically,
} from "./expectedPointsTableUpdate.mjs";

const [, , meansUrl, uncertaintyUrl] = process.argv;

downloadMeansAndUncertainty(CRIB_ASSETS, meansUrl, uncertaintyUrl)
  .then(writeTablesAtomically)
  .catch(reportFailure);
