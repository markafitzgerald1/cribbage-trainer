import { rename, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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

const UNCERTAINTY_SCHEMA = "expected-points-uncertainty.v1";

export const CRIB_ASSET_URL =
  "https://github.com/markafitzgerald1/simulate-cribbage-games/releases/download/expected-crib-points/expected_crib_points.client.json";
export const CRIB_UNCERTAINTY_ASSET_URL =
  "https://github.com/markafitzgerald1/simulate-cribbage-games/releases/download/expected-crib-points/expected_crib_points.uncertainty.json";
export const PLAY_ASSET_URL =
  "https://github.com/markafitzgerald1/simulate-cribbage-games/releases/download/expected-play-points/expected_play_points.client.json";

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

const UNCERTAINTY_STATISTIC = "reported_marginal_se";
const UNCERTAINTY_N_SEMANTICS = "sum_weights";
const QUALIFICATION_KEYS = ["crib", "play", "scope"];
// `keys`, `roles`, `ranks`, `slots` - in the order a record identity spells them.
const IDENTITY_FIELDS = ["keys", "roles", "ranks", "slots"];
const MINIMUM_OBSERVATIONS = 2;
const MEANS_DIGEST = /^[0-9a-f]{64}$/u;

const assertHeaderValue = (sidecar, field, expected) => {
  if (sidecar[field] !== expected) {
    throw new Error(
      `Downloaded crib uncertainty sidecar declares ${field} ` +
        `${JSON.stringify(sidecar[field])}; expected ${JSON.stringify(expected)}`,
    );
  }
};

const readVocabulary = (sidecar) =>
  IDENTITY_FIELDS.map((field) => {
    const value = sidecar[field];
    if (
      !Array.isArray(value) ||
      value.length === 0 ||
      value.some((item) => typeof item !== "string")
    ) {
      throw new Error(
        `Downloaded crib uncertainty sidecar has no usable ${field} list`,
      );
    }
    return new Set(value);
  });

const assertQualifications = (sidecar) => {
  assertObject(
    sidecar.qualifications,
    "Downloaded crib uncertainty sidecar is missing qualifications",
  );
  for (const key of QUALIFICATION_KEYS) {
    const text = sidecar.qualifications[key];
    if (typeof text !== "string" || text.length === 0) {
      throw new Error(
        `Downloaded crib uncertainty sidecar has no ${key} qualification`,
      );
    }
  }
};

const assertRecord = (identity, record, vocabulary) => {
  const parts = identity.split("/");
  if (
    parts.length !== vocabulary.length ||
    vocabulary.some((allowed, index) => !allowed.has(parts[index]))
  ) {
    throw new Error(
      `Downloaded crib uncertainty sidecar has an unrecognized identity ${identity}`,
    );
  }
  assertObject(record, `Missing crib uncertainty record for ${identity}`);
  const { n: weight, sum_w2: squaredWeight } = record;
  const standardError = record[UNCERTAINTY_STATISTIC];
  const finite = (value) => typeof value === "number" && Number.isFinite(value);
  if (
    !finite(standardError) ||
    standardError < 0 ||
    !finite(weight) ||
    !finite(squaredWeight) ||
    squaredWeight < 0 ||
    weight < MINIMUM_OBSERVATIONS ||
    weight - squaredWeight / weight <= 0
  ) {
    throw new Error(
      `Downloaded crib uncertainty sidecar has unusable statistics for ${identity}`,
    );
  }
};

/*
 * Checks the whole version-1 contract, not just the header, because this runs
 * before either file is written and a sidecar the browser's reader would
 * reject is one that silently removes every bound from the next build. The
 * browser's reader is TypeScript and this is a plain Node script, so the two
 * cannot share an implementation; `scripts/vendoredTables.test.mjs` runs this
 * one against the vendored file and `src/game/cribUncertainty.test.ts` runs
 * the other against the same bytes, so a document only one of them accepts
 * fails a gate rather than shipping.
 *
 * Deliberately no pinned record count. The sidecar contract lets the exported
 * record set grow - future category records arrive as their own group - so a
 * frozen number here would reject a legitimate refresh. The header's own
 * `record_count` is what a truncated download contradicts.
 */
export const validateCribUncertainty = (sidecar) => {
  assertObject(sidecar, "Downloaded crib uncertainty sidecar is not an object");
  assertHeaderValue(sidecar, "schema", UNCERTAINTY_SCHEMA);
  assertHeaderValue(sidecar, "table", "crib");
  assertHeaderValue(sidecar, "statistic", UNCERTAINTY_STATISTIC);
  assertHeaderValue(sidecar, "n_semantics", UNCERTAINTY_N_SEMANTICS);
  if (!MEANS_DIGEST.test(sidecar.means_sha256 ?? "")) {
    throw new Error(
      "Downloaded crib uncertainty sidecar names no means digest to check",
    );
  }
  assertQualifications(sidecar);
  const vocabulary = readVocabulary(sidecar);

  const totals = sidecar.record_groups?.totals;
  assertObject(
    totals,
    "Downloaded crib uncertainty sidecar is missing record_groups.totals",
  );
  assertObject(
    totals.records,
    "Downloaded crib uncertainty sidecar totals group has no records",
  );
  const entries = Object.entries(totals.records);
  if (totals.record_count !== entries.length) {
    throw new Error(
      `Downloaded crib uncertainty sidecar declares ${totals.record_count} ` +
        `total records but carries ${entries.length}`,
    );
  }
  if (entries.length === 0) {
    throw new Error("Downloaded crib uncertainty sidecar carries no records");
  }
  for (const [identity, record] of entries) {
    assertRecord(identity, record, vocabulary);
  }
};

const sha256 = (body) =>
  createHash("sha256").update(body, "utf8").digest("hex");

/*
 * The publication is atomic per release, but two downloads are not: a rolling
 * release replaced between them would pair a new means file with an old
 * sidecar, which is exactly the combination the contract forbids. The sidecar
 * names the means it was exported against, so hashing the bytes that arrived
 * settles it before anything is written.
 */
export const assertCribMeansDigest = (sidecar, meansBody) => {
  const digest = sha256(meansBody);
  if (sidecar.means_sha256 !== digest) {
    throw new Error(
      `Crib uncertainty sidecar was exported against means ` +
        `${sidecar.means_sha256} but the downloaded means hash to ${digest}. ` +
        "The rolling release changed between the two downloads; rerun the update.",
    );
  }
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
 * sidecar is pretty-printed across 45,607 lines, which no reviewer reads and
 * which the pull request size gate counts in full. Re-serializing changes no
 * value - IEEE 754 doubles round-trip exactly through JSON - and the digests
 * that matter are fields inside the document rather than of it.
 */
const toMinifiedBody = (value) => `${JSON.stringify(value)}\n`;

export const downloadCribAssets = async (
  meansUrl = CRIB_ASSET_URL,
  uncertaintyUrl = CRIB_UNCERTAINTY_ASSET_URL,
) => {
  const [means, uncertainty] = await Promise.all([
    downloadTable(meansUrl, validateCribTable),
    downloadTable(uncertaintyUrl, validateCribUncertainty),
  ]);
  /*
   * The exact published bytes, not the newline-normalized `body` the play
   * table gets: the sidecar's `means_sha256` names these bytes, so anything
   * written here that is not byte-identical to what was hashed would leave a
   * pair that `npm run test:vendored-tables` rejects on its next run. Hashing
   * and writing the same constant is what makes that impossible rather than
   * merely unlikely.
   */
  const cribMeansBody = means.raw;
  assertCribMeansDigest(uncertainty.parsed, cribMeansBody);
  return [
    { body: cribMeansBody, outputPath: CRIB_OUTPUT_PATH },
    {
      body: toMinifiedBody(uncertainty.parsed),
      outputPath: CRIB_UNCERTAINTY_OUTPUT_PATH,
    },
  ];
};

export const writeTableAtomically = async (outputPath, body) => {
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, body);
  await rename(temporaryPath, outputPath);
  process.stdout.write(
    `Updated ${outputPath} (${Buffer.byteLength(body, "utf8").toLocaleString()} bytes).\n`,
  );
};

export const writeTablesAtomically = async (files) => {
  await Promise.all(
    files.map(({ body, outputPath }) => writeTableAtomically(outputPath, body)),
  );
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
