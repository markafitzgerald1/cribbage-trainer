import {
  PLAY_ASSET_URL,
  PLAY_OUTPUT_PATH,
  downloadCribAssets,
  downloadTable,
  validatePlayTable,
  writeTablesAtomically,
} from "./expectedPointsTableUpdate.mjs";

Promise.all([
  downloadCribAssets(),
  downloadTable(PLAY_ASSET_URL, validatePlayTable),
])
  .then(([cribFiles, play]) =>
    writeTablesAtomically([
      ...cribFiles,
      { body: play.body, outputPath: PLAY_OUTPUT_PATH },
    ]),
  )
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
