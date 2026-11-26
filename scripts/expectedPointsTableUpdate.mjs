import {
  CRIB_UNCERTAINTY_CONTRACT,
  PLAY_UNCERTAINTY_CONTRACT,
  assertMeansDigest,
  sha256,
  validateUncertainty,
} from "./uncertaintySidecar.mjs";
import {
  artifactText,
  assertExactNumbers,
  assertIntegerLexemes,
  parseArtifactJson,
  stringifyArtifactJson,
} from "./artifactJson.mjs";
import { rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runnerImport } from "vite";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const GAME_DIRECTORY = path.join(SCRIPT_DIRECTORY, "..", "src", "game");
const PLAY_POINT_TYPES = [
  "fifteen",
  "thirty_one",
  "pair",
  "run",
  "go",
  "last_card",
];

const RELEASE_DOWNLOAD =
  "https://github.com/markafitzgerald1/simulate-cribbage-games/releases/download";

export const CRIB_ASSET_URL = `${RELEASE_DOWNLOAD}/expected-crib-points/expected_crib_points.client.json`;
export const CRIB_UNCERTAINTY_ASSET_URL = `${RELEASE_DOWNLOAD}/expected-crib-points/expected_crib_points.uncertainty.json`;
export const PLAY_ASSET_URL = `${RELEASE_DOWNLOAD}/expected-play-points/expected_play_points.client.json`;
export const PLAY_UNCERTAINTY_ASSET_URL = `${RELEASE_DOWNLOAD}/expected-play-points/expected_play_points.uncertainty.json`;

export const PLAY_LINES_URL = `${RELEASE_DOWNLOAD}/expected-play-points/expected_play_points.lines.json`;

export const CRIB_OUTPUT_PATH = path.join(
  GAME_DIRECTORY,
  "expectedCribPointsTable.json",
);
export const CRIB_UNCERTAINTY_OUTPUT_PATH = path.join(
  GAME_DIRECTORY,
  "expectedCribPointsUncertainty.json",
);
export const PLAY_OUTPUT_PATH = path.join(
  GAME_DIRECTORY,
  "expectedPlayPointsTable.json",
);
export const PLAY_UNCERTAINTY_OUTPUT_PATH = path.join(
  GAME_DIRECTORY,
  "expectedPlayPointsUncertainty.json",
);

export const PLAY_LINES_OUTPUT_PATH = path.join(
  GAME_DIRECTORY,
  "expectedPlayPointsLines.json",
);

const assertObject = (value, message) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(message);
  }
};

export const validateCribTable = (table) => {
  assertObject(table, "Downloaded crib EV table is not an object");
  if (!("__metadata__" in table)) {
    throw new Error("Downloaded crib EV table is missing __metadata__");
  }
  if (Object.keys(table).length !== 170) {
    throw new Error(
      `Downloaded crib EV table has ${Object.keys(table).length} keys; ` +
        "expected 170 (169 discard keys plus __metadata__)",
    );
  }
};

const validatePlayPlayer = (player, context) => {
  assertObject(player, `Missing play player bucket for ${context}`);
  assertObject(player.points, `Missing play point breakdown for ${context}`);
  const componentTotal = PLAY_POINT_TYPES.reduce((total, pointType) => {
    const pointBucket = player.points[pointType];
    if (typeof pointBucket?.mu !== "number") {
      throw new Error(`Missing ${pointType} play points for ${context}`);
    }
    return total + pointBucket.mu;
  }, 0);
  if (
    typeof player.mu !== "number" ||
    Math.abs(componentTotal - player.mu) > 0.001
  ) {
    throw new Error(`Play point breakdown does not sum for ${context}`);
  }
};

export const validatePlayTable = (table) => {
  assertObject(table, "Downloaded play EV table is not an object");
  const handEntries = Object.entries(table);
  if (handEntries.length !== 1820) {
    throw new Error("Downloaded play EV table does not contain 1,820 hands");
  }
  for (const [handKey, hand] of handEntries) {
    assertObject(hand, `Missing play hand bucket for ${handKey}`);
    for (const role of ["Pone", "Dealer"]) {
      const roleBucket = hand[role];
      assertObject(roleBucket, `Missing ${role} play bucket for ${handKey}`);
      validatePlayPlayer(roleBucket.players?.Pone, `${handKey}/${role}/Pone`);
      validatePlayPlayer(
        roleBucket.players?.Dealer,
        `${handKey}/${role}/Dealer`,
      );
      const target = roleBucket.players[role].mu;
      const opponentRole = role === "Pone" ? "Dealer" : "Pone";
      const opponent = roleBucket.players[opponentRole].mu;
      if (
        typeof roleBucket.mu !== "number" ||
        Math.abs(roleBucket.mu - (target - opponent)) > 0.001
      ) {
        throw new Error(`Play delta does not match seat totals for ${handKey}`);
      }
    }
  }
};

const PLAY_LINES_SCHEMA = "expected-play-lines.v1";
const PLAY_LINES_INTEGER_COLUMNS = [
  ["0", "1"],
  ["0", "1", "4", "5"],
];

/*
 * The browser reader itself, loaded through Vite as the app loads it, so the
 * updater cannot write a file the app would then refuse: a second copy of the
 * contract here would drift from that one.
 */
let pegLinesReader = null;
const readPegLines = async (lines) => {
  pegLinesReader ??= runnerImport(path.join(GAME_DIRECTORY, "pegLines.ts"));
  const { module } = await pegLinesReader;
  return module.parsePegLines(lines);
};

/*
 * What only the published tokens show, after the reader has passed the
 * structure: a whole count spelled `13000.0` or `1.3e4` parses to the same
 * double as `13000`, but the contract's counts are JSON integers.
 */
const assertLinesIntegers = (lines) => {
  assertIntegerLexemes(lines.provenance, ["seed"]);
  assertIntegerLexemes(lines.precision, Object.keys(lines.precision));
  for (const roles of lines.entries) {
    roles.forEach((rows, role) => {
      for (const row of rows) {
        assertIntegerLexemes(row, PLAY_LINES_INTEGER_COLUMNS.at(role));
      }
    });
  }
};

/*
 * One line matters because the size gate counts every one. The reader is
 * handed a parsed object, as Vite hands it to the app, so the tokens are
 * checked here: nothing after parsing can see what parsing rounded.
 */
export const validatePlayLines = async (lines, raw) => {
  assertObject(lines, "Downloaded play lines file is not an object");
  if (lines.schema !== PLAY_LINES_SCHEMA) {
    throw new Error(
      `Downloaded play lines file declares schema ` +
        `${JSON.stringify(lines.schema)}; expected ${PLAY_LINES_SCHEMA}`,
    );
  }
  if (!/^[^\r\n]*\n?$/u.test(raw)) {
    throw new Error("Downloaded play lines file is not minified onto one line");
  }
  assertExactNumbers(lines);
  if ((await readPegLines(lines)) === null) {
    throw new Error(
      "Downloaded play lines file fails the browser reader, src/game/pegLines.ts",
    );
  }
  assertLinesIntegers(lines);
};

/*
 * Same pairing rule as the sidecar's, for the same reason: the companion
 * names the exact means bytes it was exported against, and a rolling release
 * replaced between downloads would otherwise vendor a mismatched pair.
 */
export const assertLinesDigest = (lines, meansBody) => {
  const digest = sha256(meansBody);
  if (lines.means_sha256 !== digest) {
    throw new Error(
      `The play lines file was exported against means ${lines.means_sha256} ` +
        `but the downloaded means hash to ${digest}. ` +
        "The rolling release changed between the downloads; rerun the update.",
    );
  }
};

/*
 * Everything one rolling release publishes and this repository vendors: the
 * client means, its uncertainty sidecar, and where each is written. The two
 * tables differ only in these values, so the download, digest check and
 * write path below are one code path rather than two.
 */
export const CRIB_ASSETS = {
  contract: CRIB_UNCERTAINTY_CONTRACT,
  meansOutputPath: CRIB_OUTPUT_PATH,
  meansUrl: CRIB_ASSET_URL,
  uncertaintyOutputPath: CRIB_UNCERTAINTY_OUTPUT_PATH,
  uncertaintyUrl: CRIB_UNCERTAINTY_ASSET_URL,
  validateMeans: validateCribTable,
};

export const PLAY_ASSETS = {
  contract: PLAY_UNCERTAINTY_CONTRACT,
  linesOutputPath: PLAY_LINES_OUTPUT_PATH,
  linesUrl: PLAY_LINES_URL,
  meansOutputPath: PLAY_OUTPUT_PATH,
  meansUrl: PLAY_ASSET_URL,
  uncertaintyOutputPath: PLAY_UNCERTAINTY_OUTPUT_PATH,
  uncertaintyUrl: PLAY_UNCERTAINTY_ASSET_URL,
  validateMeans: validatePlayTable,
};

const downloadAsset = async (assetUrl) => {
  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download EV table from ${assetUrl}: ${response.status} ${response.statusText}`,
    );
  }
  return artifactText(await response.arrayBuffer());
};

export const downloadTable = async (assetUrl, validate) => {
  const raw = await downloadAsset(assetUrl);
  const parsed = parseArtifactJson(raw);
  await validate(parsed, raw);
  return { body: raw.endsWith("\n") ? raw : `${raw}\n`, parsed, raw };
};

/*
 * Stored minified, the way both means tables already are: the published
 * sidecars are pretty-printed across tens of thousands of lines, which no
 * reviewer reads and which the pull request size gate counts in full.
 * Keep numeric tokens so exact integers survive beyond binary64 precision;
 * the digests that matter are fields inside the document rather than of it.
 */
const toMinifiedBody = (value) => `${stringifyArtifactJson(value)}\n`;

/*
 * Whether lines are paired is the assets' to say, never the caller's: an
 * override replaces a URL, and a null one falls back rather than skipping.
 */
export const downloadMeansAndUncertainty = async (assets, urls = {}) => {
  const meansUrl = urls.meansUrl ?? assets.meansUrl;
  const uncertaintyUrl = urls.uncertaintyUrl ?? assets.uncertaintyUrl;
  const linesUrl = Object.hasOwn(assets, "linesUrl")
    ? (urls.linesUrl ?? assets.linesUrl)
    : null;
  const [means, uncertainty, lines] = await Promise.all([
    downloadTable(meansUrl, assets.validateMeans),
    downloadTable(uncertaintyUrl, (sidecar) =>
      validateUncertainty(sidecar, assets.contract),
    ),
    linesUrl === null ? null : downloadTable(linesUrl, validatePlayLines),
  ]);
  /*
   * The exact published bytes rather than the newline-normalized `body`: the
   * sidecar's `means_sha256` names these bytes, so anything written here that
   * is not byte-identical to what was hashed would leave a pair that
   * `npm run test:vendored-tables` rejects on its next run. Hashing and
   * writing the same constant is what makes that impossible rather than
   * merely unlikely.
   */
  const meansBody = means.raw;
  assertMeansDigest(uncertainty.parsed, meansBody, assets.contract);
  const files = [
    { body: meansBody, outputPath: assets.meansOutputPath },
    {
      body: toMinifiedBody(uncertainty.parsed),
      outputPath: assets.uncertaintyOutputPath,
    },
  ];
  if (lines === null) {
    return files;
  }
  assertLinesDigest(lines.parsed, meansBody);
  return [...files, { body: lines.raw, outputPath: assets.linesOutputPath }];
};

const temporaryPathFor = (outputPath) => `${outputPath}.tmp-${process.pid}`;

const announce = (outputPath, body) => {
  process.stdout.write(
    `Updated ${outputPath} (${Buffer.byteLength(body, "utf8").toLocaleString()} bytes).\n`,
  );
};

/*
 * Every temporary file is written before any of them replaces its target, so
 * a failure that belongs to writing - a full disk above all - happens while
 * the vendored files are still the pairs they were. The renames that follow
 * are same-directory and cannot be made one atomic step on POSIX, so a
 * failure among them would still leave a mismatched pair. That residue is
 * what `npm run test:vendored-tables` exists to catch, and it now runs on
 * every commit, every pull request, and the production deploy.
 */
export const writeTablesAtomically = async (files) => {
  const staged = await Promise.all(
    files.map(async ({ body, outputPath }) => {
      const temporaryPath = temporaryPathFor(outputPath);
      await writeFile(temporaryPath, body);
      return { body, outputPath, temporaryPath };
    }),
  );
  await Promise.all(
    staged.map(async ({ body, outputPath, temporaryPath }) => {
      await rename(temporaryPath, outputPath);
      announce(outputPath, body);
    }),
  );
};

export const reportFailure = (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
};
