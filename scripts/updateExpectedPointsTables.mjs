import {
  CRIB_ASSET_URL,
  CRIB_OUTPUT_PATH,
  PLAY_ASSET_URL,
  PLAY_OUTPUT_PATH,
  downloadTable,
  validateCribTable,
  validatePlayTable,
  writeTableAtomically,
} from "./expectedPointsTableUpdate.mjs";

Promise.all([
  downloadTable(CRIB_ASSET_URL, validateCribTable),
  downloadTable(PLAY_ASSET_URL, validatePlayTable),
])
  .then(([cribBody, playBody]) =>
    Promise.all([
      writeTableAtomically(CRIB_OUTPUT_PATH, cribBody),
      writeTableAtomically(PLAY_OUTPUT_PATH, playBody),
    ]),
  )
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
