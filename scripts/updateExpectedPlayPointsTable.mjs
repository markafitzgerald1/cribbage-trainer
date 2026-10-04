import {
  PLAY_ASSETS,
  downloadMeansAndUncertainty,
  reportFailure,
  writeTablesAtomically,
} from "./expectedPointsTableUpdate.mjs";

const [, , meansUrl, uncertaintyUrl, linesUrl] = process.argv;

downloadMeansAndUncertainty(PLAY_ASSETS, {
  linesUrl,
  meansUrl,
  uncertaintyUrl,
})
  .then(writeTablesAtomically)
  .catch(reportFailure);
