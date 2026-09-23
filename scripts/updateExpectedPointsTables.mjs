import {
  CRIB_ASSETS,
  PLAY_ASSETS,
  downloadMeansAndUncertainty,
  reportFailure,
  writeTablesAtomically,
} from "./expectedPointsTableUpdate.mjs";

/*
 * Both pairs are downloaded before anything is written, so a rolling release
 * that moves under one of them fails the whole refresh rather than leaving
 * one table newer than the other.
 */
Promise.all([
  downloadMeansAndUncertainty(CRIB_ASSETS),
  downloadMeansAndUncertainty(PLAY_ASSETS),
])
  .then((pairs) => writeTablesAtomically(pairs.flat()))
  .catch(reportFailure);
