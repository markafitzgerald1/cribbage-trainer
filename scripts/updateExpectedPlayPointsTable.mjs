import {
  PLAY_ASSET_URL,
  PLAY_OUTPUT_PATH,
  downloadTable,
  validatePlayTable,
  writeTableAtomically,
} from "./expectedPointsTableUpdate.mjs";

const [, , assetUrl = PLAY_ASSET_URL] = process.argv;

downloadTable(assetUrl, validatePlayTable)
  .then((body) => writeTableAtomically(PLAY_OUTPUT_PATH, body))
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
