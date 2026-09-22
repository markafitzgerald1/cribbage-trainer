import {
  downloadCribAssets,
  writeTablesAtomically,
} from "./expectedPointsTableUpdate.mjs";

const [, , meansUrl, uncertaintyUrl] = process.argv;

downloadCribAssets(meansUrl, uncertaintyUrl)
  .then(writeTablesAtomically)
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
