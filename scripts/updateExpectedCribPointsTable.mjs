/**
 * Refresh the vendored crib EV table from the simulator's rolling release.
 *
 * The lean client table is produced by the simulate-cribbage-games pipeline
 * (artifact_pipeline/generate_table.py) and published as an asset on its rolling
 * `expected-crib-points` GitHub release. This script downloads that asset and
 * writes it to src/game/expectedCribPointsTable.json, which the app imports
 * directly. The table is committed (vendored) so builds, tests, and snapshots
 * stay deterministic; run this script deliberately to pull a newer table, then
 * regenerate snapshots (`npx jest -u`) and review the diff.
 *
 * Usage: node scripts/updateExpectedCribPointsTable.mjs [asset-url]
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { writeFile } from "node:fs/promises";

const DEFAULT_ASSET_URL =
  "https://github.com/markafitzgerald1/simulate-cribbage-games/releases/download/expected-crib-points/expected_crib_points.client.json";

const OUTPUT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "game",
  "expectedCribPointsTable.json",
);

const main = async () => {
  const [, , assetUrlArg] = process.argv;
  const assetUrl = assetUrlArg ?? DEFAULT_ASSET_URL;

  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download crib EV table from ${assetUrl}: ${response.status} ${response.statusText}`,
    );
  }

  const body = await response.text();
  // Validate the payload before overwriting the committed table.
  const table = JSON.parse(body);
  if (
    typeof table !== "object" ||
    table === null ||
    !("__metadata__" in table)
  ) {
    throw new Error("Downloaded crib EV table is missing __metadata__");
  }

  const normalized = body.endsWith("\n") ? body : `${body}\n`;
  await writeFile(OUTPUT_PATH, normalized);
  process.stdout.write(
    `Updated ${OUTPUT_PATH} (${Buffer.byteLength(normalized, "utf8").toLocaleString()} bytes). Regenerate snapshots with: npx jest -u\n`,
  );
};

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
