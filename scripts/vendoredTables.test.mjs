import {
  CRIB_OUTPUT_PATH,
  CRIB_UNCERTAINTY_OUTPUT_PATH,
  assertCribMeansDigest,
  validateCribTable,
  validateCribUncertainty,
} from "./expectedPointsTableUpdate.mjs";
import { ok, strictEqual } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/*
 * The vendored crib means and the vendored uncertainty sidecar are a matched
 * pair: the sidecar names the exact means bytes it was exported against, and
 * the contract forbids pairing a new means file with an old sidecar. Nothing
 * else in the build can notice that, because both files parse and the app
 * renders either way - the only symptom would be error bars quoted against a
 * table nobody is looking at. Refreshing one alone reddens this instead.
 */
const readVendored = (outputPath) => readFileSync(outputPath, "utf8");

test("the vendored crib means still satisfy the updater's checks", () => {
  validateCribTable(JSON.parse(readVendored(CRIB_OUTPUT_PATH)));
});

test("the vendored crib uncertainty sidecar still satisfies the updater's checks", () => {
  const sidecar = JSON.parse(readVendored(CRIB_UNCERTAINTY_OUTPUT_PATH));

  validateCribUncertainty(sidecar);

  const { record_count: recordCount, records } = sidecar.record_groups.totals;

  strictEqual(recordCount, Object.keys(records).length);
  ok(recordCount > 0, "expected the sidecar to publish at least one record");
});

test("the vendored sidecar was exported against the vendored means", () => {
  assertCribMeansDigest(
    JSON.parse(readVendored(CRIB_UNCERTAINTY_OUTPUT_PATH)),
    readVendored(CRIB_OUTPUT_PATH),
  );
});
