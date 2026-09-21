import {
  CRIB_OUTPUT_PATH,
  CRIB_UNCERTAINTY_OUTPUT_PATH,
  assertCribMeansDigest,
  validateCribTable,
  validateCribUncertainty,
} from "./expectedPointsTableUpdate.mjs";
import { ok, strictEqual, throws } from "node:assert/strict";
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

/*
 * The case the guard exists for, which the passing case above cannot show:
 * a rolling release replaced between the two downloads leaves means that no
 * longer hash to what the sidecar names. One byte is enough, and has to be,
 * because a digest that tolerated a byte would not be doing anything.
 */
test("a means file of different bytes fails the matched-pair guard", () => {
  throws(() =>
    assertCribMeansDigest(
      JSON.parse(readVendored(CRIB_UNCERTAINTY_OUTPUT_PATH)),
      `${readVendored(CRIB_OUTPUT_PATH)} `,
    ),
  );
});

/*
 * The browser's reader (`src/game/cribUncertainty.ts`) and this updater check
 * the same version-1 contract in two languages, so they can drift. These
 * cases are the shapes `src/game/cribUncertainty.test.ts` asserts the reader
 * rejects; asserting the updater rejects them too is what keeps a refresh
 * from writing a document the app would then silently read as no sidecar at
 * all. Each starts from the real vendored file, so a case that stops being a
 * malformation fails here rather than passing vacuously.
 */
const mutatedSidecar = (mutate) => {
  const sidecar = JSON.parse(readVendored(CRIB_UNCERTAINTY_OUTPUT_PATH));
  mutate(sidecar, Object.keys(sidecar.record_groups.totals.records)[0]);
  return sidecar;
};

const REJECTED = [
  ["an unsupported schema", (doc) => (doc.schema = "unsupported.v2")],
  ["the play table", (doc) => (doc.table = "play")],
  ["another statistic", (doc) => (doc.statistic = "calibrated_se")],
  ["another weight semantics", (doc) => (doc.n_semantics = "simulation_count")],
  ["a means digest that is not one", (doc) => (doc.means_sha256 = "no")],
  ["no means digest at all", (doc) => delete doc.means_sha256],
  ["an emptied qualification", (doc) => (doc.qualifications.scope = "")],
  ["no starter rank list", (doc) => (doc.ranks = [])],
  ["one discard key too many", (doc) => doc.keys.push("A_2_Suited")],
  ["a discard key of the wrong shape", (doc) => (doc.keys[0] = "nope")],
  ["an unknown role", (doc) => (doc.roles[1] = "Banker")],
  ["a starter rank list version 1 does not pin", (doc) => doc.ranks.pop()],
  ["an unknown slot", (doc) => (doc.slots[4] = "made_up_slot")],
  [
    "a truncated record set",
    (doc, id) => delete doc.record_groups.totals.records[id],
  ],
  [
    "an identity the header does not declare",
    (doc, id) => {
      const { records } = doc.record_groups.totals;
      records[`${id}/extra`] = records[id];
      delete records[id];
    },
  ],
  [
    "a negative standard error",
    (doc, id) =>
      (doc.record_groups.totals.records[id].reported_marginal_se = -1),
  ],
  [
    "fewer observations than the exporter would keep",
    (doc, id) =>
      Object.assign(doc.record_groups.totals.records[id], { n: 1, sum_w2: 1 }),
  ],
  [
    "a weighted-variance denominator that is not positive",
    (doc, id) =>
      Object.assign(doc.record_groups.totals.records[id], { n: 2, sum_w2: 4 }),
  ],
];

for (const [name, mutate] of REJECTED) {
  test(`the updater refuses a sidecar with ${name}`, () => {
    throws(() => validateCribUncertainty(mutatedSidecar(mutate)));
  });
}
