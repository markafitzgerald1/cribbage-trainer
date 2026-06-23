/**
 * Slim the generated crib EV table down to what the web client actually reads.
 *
 * The simulation pipeline (artifact_pipeline.generate_table.*) emits a table
 * carrying generation bookkeeping the browser never uses: per-bucket `n`, `se`,
 * `sum_w2`, a redundant `points.total`, a full duplicate of every accumulator
 * under `__metadata__.generation_accumulators`, and `starter_suit_relation`
 * buckets for every discard. The client only reads each bucket's `mu` and the
 * five `points.<category>.mu` values, so this transform projects the table to:
 *
 *   bucket = { mu, points?: { <category>: { mu } }, starter_suit_relation?: {...} }
 *
 * It also drops `starter_suit_relation` for unsuited, non-Jack discards. Crib EV
 * only depends on the starter's suit through flushes (possible only when both
 * discards share a suit) and his-nobs (a discarded Jack matching the starter
 * suit). For an unsuited, non-Jack discard the relation buckets are pure Monte
 * Carlo noise, so keeping them both bloats the payload and makes E(c) appear to
 * vary by starter suit when it cannot.
 *
 * The projection is idempotent: re-running it on an already-slim table is a
 * no-op, so it can be applied after regenerating the raw table.
 *
 * Usage: node scripts/slimExpectedCribPointsTable.mjs [input.json] [output.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DEFAULT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "game",
  "expectedCribPointsTable.json",
);

const POINT_CATEGORIES = ["fifteens", "flushes", "nobs", "pairs", "runs"];
const MU_DECIMAL_PLACES = 4;
const METADATA_KEY = "__metadata__";
const JACK_RANK = "J";

const roundMu = (mu) => {
  const factor = 10 ** MU_DECIMAL_PLACES;
  const rounded = Math.round(mu * factor) / factor;
  // Normalize -0 to 0 for stable, noise-free serialization.
  return Object.is(rounded, -0) ? 0 : rounded;
};

const slimPoints = (points) => {
  const slim = {};
  for (const category of POINT_CATEGORIES) {
    const point = points[category];
    if (point && typeof point.mu === "number") {
      slim[category] = { mu: roundMu(point.mu) };
    }
  }
  return slim;
};

const slimBucket = (bucket, keepRelations) => {
  if (typeof bucket === "number") {
    return roundMu(bucket);
  }

  const slim = { mu: roundMu(bucket.mu) };
  if (bucket.points) {
    slim.points = slimPoints(bucket.points);
  }
  if (keepRelations && bucket.starter_suit_relation) {
    const relations = {};
    for (const [relation, relationBucket] of Object.entries(
      bucket.starter_suit_relation,
    )) {
      // Relation buckets are themselves leaf buckets (no nested relations).
      relations[relation] = slimBucket(relationBucket, false);
    }
    slim.starter_suit_relation = relations;
  }
  return slim;
};

const starterSuitMatters = (discardKey) => {
  const [firstRank, secondRank, suitGroup] = discardKey.split("_");
  return (
    suitGroup === "Suited" ||
    firstRank === JACK_RANK ||
    secondRank === JACK_RANK
  );
};

export const slimTable = (table) => {
  const slim = {};
  for (const [discardKey, value] of Object.entries(table)) {
    if (discardKey === METADATA_KEY) {
      // Drop the generation accumulators: a full duplicate of every bucket's
      // raw sampling state that the browser never reads.
      const metadata = { ...value };
      delete metadata.generation_accumulators;
      slim[METADATA_KEY] = metadata;
      continue;
    }
    const keepRelations = starterSuitMatters(discardKey);
    const roleBuckets = {};
    for (const [role, starters] of Object.entries(value)) {
      const slimStarters = {};
      for (const [starterRank, bucket] of Object.entries(starters)) {
        slimStarters[starterRank] = slimBucket(bucket, keepRelations);
      }
      roleBuckets[role] = slimStarters;
    }
    slim[discardKey] = roleBuckets;
  }
  return slim;
};

const main = () => {
  const [, , inputArg, outputArg] = process.argv;
  const input = inputArg ?? DEFAULT_PATH;
  const output = outputArg ?? input;

  const original = readFileSync(input, "utf8");
  const slim = slimTable(JSON.parse(original));
  const serialized = JSON.stringify(slim);
  writeFileSync(output, `${serialized}\n`);

  const before = Buffer.byteLength(original, "utf8");
  const after = Buffer.byteLength(serialized, "utf8");
  const percent = ((1 - after / before) * 100).toFixed(1);
  process.stdout.write(
    `Slimmed ${input}: ${before.toLocaleString()} -> ${after.toLocaleString()} bytes (${percent}% smaller)\n`,
  );
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
