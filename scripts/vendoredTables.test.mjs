import {
  CRIB_ASSETS,
  PLAY_ASSETS,
  assertLinesDigest,
  downloadMeansAndUncertainty,
  validateCribTable,
  validatePlayLines,
  validatePlayTable,
} from "./expectedPointsTableUpdate.mjs";
import {
  assertMeansDigest,
  validateUncertainty,
} from "./uncertaintySidecar.mjs";
import {
  deepStrictEqual,
  ok,
  rejects,
  strictEqual,
  throws,
} from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/*
 * A vendored means table and its vendored uncertainty sidecar are a matched
 * pair: the sidecar names the exact means bytes it was exported against, and
 * the contract forbids pairing a new means file with an old sidecar. Nothing
 * else in the build can notice that, because both files parse and the app
 * renders either way - the only symptom would be error bars quoted against a
 * table nobody is looking at. Refreshing one alone reddens this instead.
 */
const readVendored = (outputPath) => readFileSync(outputPath, "utf8");

const sidecarOf = (assets) =>
  JSON.parse(readVendored(assets.uncertaintyOutputPath));

const PAIRS = [
  { assets: CRIB_ASSETS, validateMeans: validateCribTable },
  { assets: PLAY_ASSETS, validateMeans: validatePlayTable },
];

for (const { assets, validateMeans } of PAIRS) {
  const { contract } = assets;

  test(`the vendored ${contract.table} means still satisfy the updater's checks`, () => {
    validateMeans(JSON.parse(readVendored(assets.meansOutputPath)));
  });

  test(`the vendored ${contract.table} uncertainty sidecar still satisfies the updater's checks`, () => {
    const sidecar = sidecarOf(assets);

    validateUncertainty(sidecar, contract);

    const { record_count: recordCount, records } = sidecar.record_groups.totals;

    strictEqual(recordCount, Object.keys(records).length);
    ok(recordCount > 0, "expected the sidecar to publish at least one record");
  });

  test(`the vendored ${contract.table} sidecar was exported against the vendored means`, () => {
    assertMeansDigest(
      sidecarOf(assets),
      readVendored(assets.meansOutputPath),
      contract,
    );
  });

  /*
   * The case the guard exists for, which the passing case above cannot show:
   * a rolling release replaced between the two downloads leaves means that no
   * longer hash to what the sidecar names. One byte is enough, and has to be,
   * because a digest that tolerated a byte would not be doing anything.
   */
  test(`a ${contract.table} means file of different bytes fails the matched-pair guard`, () => {
    throws(() =>
      assertMeansDigest(
        sidecarOf(assets),
        `${readVendored(assets.meansOutputPath)} `,
        contract,
      ),
    );
  });
}

/*
 * A tie the runtime reader cannot make, because Vite hands it one parsed
 * document rather than both artifacts. The play sidecar's keys and the play
 * means table's keys are the same 1,820 hands in different orders - rank
 * order against the table's own - so this compares them as sorted sets and
 * would catch a sidecar published for a table with a different hand space.
 */
test("the vendored play sidecar keys cover the vendored play table exactly", () => {
  const sidecarKeys = [...sidecarOf(PLAY_ASSETS).keys].sort();
  const tableKeys = Object.keys(
    JSON.parse(readVendored(PLAY_ASSETS.meansOutputPath)),
  ).sort();

  deepStrictEqual(sidecarKeys, tableKeys);
});

/*
 * The browser's reader (`src/game/uncertaintySidecar.ts`) and this updater
 * check the same version-1 contract in two languages, so they can drift.
 * These cases are the shapes the reader's own specs assert it rejects;
 * asserting the updater rejects them too is what keeps a refresh from writing
 * a document the app would then silently read as no sidecar at all. Each
 * starts from a real vendored file, so a case that stops being a malformation
 * fails here rather than passing vacuously.
 */
const mutatedSidecar = (assets, mutate) => {
  const sidecar = sidecarOf(assets);
  mutate(sidecar, Object.keys(sidecar.record_groups.totals.records)[0]);
  return sidecar;
};

const SHARED_REJECTIONS = [
  ["an unsupported schema", (doc) => (doc.schema = "unsupported.v2")],
  ["another table", (doc) => (doc.table = "elsewhere")],
  ["another statistic", (doc) => (doc.statistic = "calibrated_se")],
  ["another weight semantics", (doc) => (doc.n_semantics = "made_up")],
  ["a means digest that is not one", (doc) => (doc.means_sha256 = "no")],
  ["no means digest at all", (doc) => delete doc.means_sha256],
  ["a source digest that is not one", (doc) => (doc.source_full_sha256 = "no")],
  ["no provenance at all", (doc) => delete doc.provenance],
  ["an emptied qualification", (doc) => (doc.qualifications.scope = "")],
  ["one key too many", (doc) => doc.keys.push(doc.keys[0])],
  ["a key the contract does not list", (doc) => (doc.keys[0] = "nope")],
  ["the keys in another order", (doc) => doc.keys.reverse()],
  ["an unknown role", (doc) => (doc.roles[1] = "Banker")],
  ["an unknown slot", (doc) => (doc.slots[0] = "made_up_slot")],
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
    (doc, id) => (doc.record_groups.totals.records[id].n = 1),
  ],
];

/*
 * Each table's rank list is pinned to a different thing - crib's to the
 * thirteen starter ranks, play's to the empty list the contract publishes -
 * so the malformation that proves the check is running differs too.
 */
const CRIB_REJECTIONS = [
  ["no starter rank list", (doc) => (doc.ranks = [])],
  ["a starter rank list version 1 does not pin", (doc) => doc.ranks.pop()],
  [
    "a weighted-variance denominator that is not positive",
    (doc, id) =>
      Object.assign(doc.record_groups.totals.records[id], { n: 2, sum_w2: 4 }),
  ],
];

const PLAY_REJECTIONS = [
  ["a rank list where version 1 publishes none", (doc) => (doc.ranks = ["A"])],
  [
    "provenance that does not say whether the policy converged",
    (doc) => delete doc.provenance.joint_policy_converged,
  ],
  [
    "provenance naming no policy fingerprint",
    (doc) => delete doc.provenance.policy_fingerprint,
  ],
  [
    "an empty policy fingerprint, which upstream's exporter refuses",
    (doc) => (doc.provenance.policy_fingerprint = ""),
  ],
  [
    "a simulation count that is not a whole number",
    (doc, id) => (doc.record_groups.totals.records[id].n += 0.5),
  ],
  [
    "a convergence flag that is not a boolean",
    (doc) => (doc.provenance.joint_policy_converged = "false"),
  ],
  [
    "a measured policy uncertainty where the contract publishes none",
    (doc) => (doc.policy_uncertainty = 0.01),
  ],
  [
    "no policy uncertainty field at all",
    (doc) => delete doc.policy_uncertainty,
  ],
];

/*
 * A converged joint policy would publish `true` here inside version 1, which
 * is an upstream improvement rather than a malformation: refusing it would
 * deny every pegging figure over a better simulation. The displayed copy
 * makes no convergence claim, so only the type is checked - but prose in
 * AGENTS.md and playDeltaStandardError.ts does describe the policy as
 * non-converged, and that is what would need revisiting if `true` ships.
 */
test("the updater accepts a play sidecar whose policy has converged", () => {
  const converged = mutatedSidecar(
    PLAY_ASSETS,
    (doc) => (doc.provenance.joint_policy_converged = true),
  );

  validateUncertainty(converged, PLAY_ASSETS.contract);
});

/*
 * The convergence flag is `false` on every published document, so the check
 * on it has to be a presence check: a truthiness test would reject the real
 * sidecar. Asserting the vendored one still validates is what would catch
 * that, since every case above proves only that something is rejected.
 */
test("the vendored play sidecar keeps its false convergence flag", () => {
  const { provenance } = sidecarOf(PLAY_ASSETS);

  strictEqual(provenance.joint_policy_converged, false);
  validateUncertainty(sidecarOf(PLAY_ASSETS), PLAY_ASSETS.contract);
});

const REJECTION_CASES = [
  { assets: CRIB_ASSETS, cases: [...SHARED_REJECTIONS, ...CRIB_REJECTIONS] },
  { assets: PLAY_ASSETS, cases: [...SHARED_REJECTIONS, ...PLAY_REJECTIONS] },
];

for (const { assets, cases } of REJECTION_CASES) {
  for (const [name, mutate] of cases) {
    test(`the updater refuses a ${assets.contract.table} sidecar with ${name}`, () => {
      throws(() =>
        validateUncertainty(mutatedSidecar(assets, mutate), assets.contract),
      );
    });
  }
}

/*
 * The pegging-lines companion is paired with the play means the same way the
 * sidecar is, by the SHA-256 of the exact means bytes. Its full contract is
 * the browser reader's, run against the vendored bytes by
 * src/game/pegLines.test.ts; what only this file can check is the pairing
 * across both on-disk artifacts, since Vite hands the reader one parsed
 * document rather than two files.
 */
const linesOf = () => JSON.parse(readVendored(PLAY_ASSETS.linesOutputPath));

test("the vendored play lines still satisfy the updater's checks", () => {
  validatePlayLines(linesOf(), readVendored(PLAY_ASSETS.linesOutputPath));
});

test("the vendored play lines were exported against the vendored means", () => {
  assertLinesDigest(linesOf(), readVendored(PLAY_ASSETS.meansOutputPath));
});

test("a play means file of different bytes fails the lines pairing guard", () => {
  throws(
    () =>
      assertLinesDigest(
        linesOf(),
        `${readVendored(PLAY_ASSETS.meansOutputPath)} `,
      ),
    /play lines file was exported against means/u,
  );
});

test("a whitespace-only change to the means is a different pairing", () => {
  const meansBody = readVendored(PLAY_ASSETS.meansOutputPath);

  throws(() => assertLinesDigest(linesOf(), meansBody.replace(/\{/gu, "{ ")));
});

test("the vendored play lines keys cover the vendored play table exactly", () => {
  deepStrictEqual(
    [...linesOf().keys].sort(),
    Object.keys(JSON.parse(readVendored(PLAY_ASSETS.meansOutputPath))).sort(),
  );
});

/*
 * The updater end to end against a stubbed release, because the guards above
 * prove the check function rejects but not that the updater calls it:
 * deleting the call leaves every one of them green.
 */
const stubRelease = (context, replacements = []) => {
  const bodies = new Map([
    [PLAY_ASSETS.meansUrl, readVendored(PLAY_ASSETS.meansOutputPath)],
    [
      PLAY_ASSETS.uncertaintyUrl,
      readVendored(PLAY_ASSETS.uncertaintyOutputPath),
    ],
    [PLAY_ASSETS.linesUrl, readVendored(PLAY_ASSETS.linesOutputPath)],
    ...replacements,
  ]);
  context.mock.method(globalThis, "fetch", (url) =>
    Promise.resolve({ ok: true, text: () => Promise.resolve(bodies.get(url)) }),
  );
};

const refusesLines = (context, linesBody, message) => {
  stubRelease(context, [[PLAY_ASSETS.linesUrl, linesBody]]);
  return rejects(downloadMeansAndUncertainty(PLAY_ASSETS), message);
};

test("the updater writes the lines from the exact published bytes", async (context) => {
  stubRelease(context);
  const files = await downloadMeansAndUncertainty(PLAY_ASSETS);
  const lines = files.find(
    ({ outputPath }) => outputPath === PLAY_ASSETS.linesOutputPath,
  );

  strictEqual(files.length, 3);
  strictEqual(lines.body, readVendored(PLAY_ASSETS.linesOutputPath));
});

test("the updater does not add a newline the published lines lack", async (context) => {
  const published = readVendored(PLAY_ASSETS.linesOutputPath).trimEnd();

  stubRelease(context, [[PLAY_ASSETS.linesUrl, published]]);
  const files = await downloadMeansAndUncertainty(PLAY_ASSETS);

  strictEqual(
    files.find(({ outputPath }) => outputPath === PLAY_ASSETS.linesOutputPath)
      .body,
    published,
  );
});

test("the updater refuses lines paired with other means", async (context) => {
  const otherMeans = { ...linesOf(), means_sha256: "0".repeat(64) };

  await refusesLines(
    context,
    `${JSON.stringify(otherMeans)}\n`,
    /play lines file was exported against means/u,
  );
});

test("the updater refuses lines that are not minified onto one line", async (context) => {
  await refusesLines(
    context,
    `${JSON.stringify(linesOf(), null, 1)}\n`,
    /not minified/u,
  );
});

test("the updater refuses a lines file of another schema", async (context) => {
  const other = { ...linesOf(), schema: "expected-play-lines.v2" };

  await refusesLines(context, `${JSON.stringify(other)}\n`, /declares schema/u);
});

test("the updater refuses a lines file that is not an object", async (context) => {
  await refusesLines(context, "[]\n", /not an object/u);
});
