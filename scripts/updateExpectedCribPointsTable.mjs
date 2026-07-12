import {
  CRIB_ASSET_URL,
  CRIB_OUTPUT_PATH,
  downloadTable,
  validateCribTable,
  writeTableAtomically,
} from "./expectedPointsTableUpdate.mjs";

const [, , assetUrl = CRIB_ASSET_URL] = process.argv;

downloadTable(assetUrl, validateCribTable)
  .then((body) => writeTableAtomically(CRIB_OUTPUT_PATH, body))
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
