import {
  CRIB_UNCERTAINTY_CONTRACT,
  PLAY_UNCERTAINTY_CONTRACT,
  assertMeansDigest,
  validateUncertainty,
} from "./uncertaintySidecar.mjs";
import { rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

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
  return response.text();
};

export const downloadTable = async (assetUrl, validate) => {
  const raw = await downloadAsset(assetUrl);
  const parsed = JSON.parse(raw);
  validate(parsed);
  return { body: raw.endsWith("\n") ? raw : `${raw}\n`, parsed, raw };
};

/*
 * Stored minified, the way both means tables already are: the published
 * sidecars are pretty-printed across tens of thousands of lines, which no
 * reviewer reads and which the pull request size gate counts in full.
 * Re-serializing changes no value - IEEE 754 doubles round-trip exactly
 * through JSON - and the digests that matter are fields inside the document
 * rather than of it.
 */
const toMinifiedBody = (value) => `${JSON.stringify(value)}\n`;

export const downloadMeansAndUncertainty = async (
  assets,
  meansUrl = assets.meansUrl,
  uncertaintyUrl = assets.uncertaintyUrl,
) => {
  const [means, uncertainty] = await Promise.all([
    downloadTable(meansUrl, assets.validateMeans),
    downloadTable(uncertaintyUrl, (sidecar) =>
      validateUncertainty(sidecar, assets.contract),
    ),
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
  return [
    { body: meansBody, outputPath: assets.meansOutputPath },
    {
      body: toMinifiedBody(uncertainty.parsed),
      outputPath: assets.uncertaintyOutputPath,
    },
  ];
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
