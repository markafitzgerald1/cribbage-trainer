import {
  PLAY_ASSETS,
  downloadMeansAndUncertainty,
  reportFailure,
  writeTablesAtomically,
} from "./expectedPointsTableUpdate.mjs";

const [, , meansUrl, uncertaintyUrl] = process.argv;

downloadMeansAndUncertainty(PLAY_ASSETS, meansUrl, uncertaintyUrl)
  .then(writeTablesAtomically)
  .catch(reportFailure);
