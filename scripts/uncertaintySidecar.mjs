import { createHash } from "node:crypto";

/*
 * The version-1 uncertainty sidecar contract, checked before either vendored
 * file is written. This runs the whole contract rather than just the header,
 * because a sidecar the browser's reader would reject is one that silently
 * removes every figure from the next build.
 *
 * The browser's reader is TypeScript (src/game/uncertaintySidecar.ts) and
 * this is a plain Node script, so the two cannot share an implementation.
 * `scripts/vendoredTables.test.mjs` runs this one against the vendored files
 * and the reader's own specs run the other against the same bytes, so a
 * document only one of them accepts fails a gate rather than shipping.
 */

const UNCERTAINTY_SCHEMA = "expected-points-uncertainty.v1";
const UNCERTAINTY_STATISTIC = "reported_marginal_se";
const QUALIFICATION_KEYS = ["crib", "play", "scope"];
const SHA256_DIGEST = /^[0-9a-f]{64}$/u;
const DIGEST_FIELDS = ["means_sha256", "source_full_sha256"];
const MINIMUM_OBSERVATIONS = 2;

/*
 * Version 1 pins these per table, so a sidecar does not get to declare its
 * own and then check its identities against that. They mirror the browser
 * reader's copies; vendoredTables.test.mjs runs both against the same
 * malformations so the two cannot drift.
 */
const VOCABULARY_FIELDS = ["keys", "roles", "ranks", "slots"];
const CANONICAL_RANKS = "A23456789TJQK".split("");
const CANONICAL_ROLES = ["Dealer", "Pone"];

/*
 * Both ranks in rank order, `Suited` before `Unsuited`, and no suited pair -
 * two cards of one rank cannot share a suit. Comparing the whole sequence
 * rather than a shape rejects a duplicate, a reordering, or an omitted key,
 * each of which would quietly cost one discard its bound.
 */
const CANONICAL_DISCARD_KEYS = CANONICAL_RANKS.flatMap((first, index) =>
  CANONICAL_RANKS.slice(index).flatMap((second) =>
    first === second
      ? [`${first}_${second}_Unsuited`]
      : [`${first}_${second}_Suited`, `${first}_${second}_Unsuited`],
  ),
);

/*
 * The four kept ranks in rank order. Derived rather than read off the play
 * means table, whose 1,820 keys are the same set in a different order.
 */
const CANONICAL_PLAY_HAND_KEYS = CANONICAL_RANKS.flatMap((first, firstIndex) =>
  CANONICAL_RANKS.slice(firstIndex).flatMap((second, secondOffset) =>
    CANONICAL_RANKS.slice(firstIndex + secondOffset).flatMap(
      (third, thirdOffset) =>
        CANONICAL_RANKS.slice(firstIndex + secondOffset + thirdOffset).map(
          (fourth) => `${first}_${second}_${third}_${fourth}`,
        ),
    ),
  ),
);

const CANONICAL_CRIB_SLOTS = [
  "total",
  "matching_discard_suit",
  "non_matching_discard_suit",
  "matching_rank_1_suit",
  "matching_rank_2_suit",
];

export const CRIB_UNCERTAINTY_CONTRACT = {
  identityFields: ["keys", "roles", "ranks", "slots"],
  nSemantics: "sum_weights",
  /*
   * Crib weights are a sum of weights, so the exporter omits a record with
   * fewer than two effective observations or a non-positive
   * weighted-variance denominator `n - sum_w2 / n`.
   */
  supportsTheStatistic: (record) =>
    record.n >= MINIMUM_OBSERVATIONS && record.n - record.sum_w2 / record.n > 0,
  table: "crib",
  vocabulary: {
    keys: CANONICAL_DISCARD_KEYS,
    ranks: CANONICAL_RANKS,
    roles: CANONICAL_ROLES,
    slots: CANONICAL_CRIB_SLOTS,
  },
  weightFields: ["n", "sum_w2"],
};

export const PLAY_UNCERTAINTY_CONTRACT = {
  identityFields: ["keys", "roles", "slots"],
  nSemantics: "simulation_count",
  // Play weights are a count of simulations and carry no `sum_w2` to bound.
  supportsTheStatistic: (record) => record.n >= MINIMUM_OBSERVATIONS,
  table: "play",
  vocabulary: {
    keys: CANONICAL_PLAY_HAND_KEYS,
    ranks: [],
    roles: CANONICAL_ROLES,
    slots: ["delta"],
  },
  weightFields: ["n"],
};

const assertObject = (value, message) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(message);
  }
};

const describe = (contract) =>
  `Downloaded ${contract.table} uncertainty sidecar`;

const assertHeaderValue = (sidecar, contract, [field, expected]) => {
  if (sidecar[field] !== expected) {
    throw new Error(
      `${describe(contract)} declares ${field} ` +
        `${JSON.stringify(sidecar[field])}; expected ${JSON.stringify(expected)}`,
    );
  }
};

/*
 * An empty canonical list is a list the document must publish empty, so
 * play's `ranks: []` is required rather than merely tolerated.
 */
const assertCanonicalList = (sidecar, contract, field) => {
  const expected = contract.vocabulary[field];
  const value = sidecar[field];
  const matches =
    Array.isArray(value) &&
    value.length === expected.length &&
    value.every((item, index) => item === expected[index]);
  if (!matches) {
    throw new Error(
      `${describe(contract)} declares a ${field} list that version 1 does not`,
    );
  }
};

const readVocabulary = (sidecar, contract) => {
  for (const field of VOCABULARY_FIELDS) {
    assertCanonicalList(sidecar, contract, field);
  }
  return contract.identityFields.map(
    (field) => new Set(contract.vocabulary[field]),
  );
};

const assertProvenance = (sidecar, contract) => {
  for (const field of DIGEST_FIELDS) {
    if (!SHA256_DIGEST.test(sidecar[field] ?? "")) {
      throw new Error(`${describe(contract)} names no usable ${field}`);
    }
  }
  assertObject(
    sidecar.provenance,
    `${describe(contract)} carries no provenance`,
  );
};

const assertQualifications = (sidecar, contract) => {
  assertObject(
    sidecar.qualifications,
    `${describe(contract)} is missing qualifications`,
  );
  for (const key of QUALIFICATION_KEYS) {
    const text = sidecar.qualifications[key];
    if (typeof text !== "string" || text.length === 0) {
      throw new Error(`${describe(contract)} has no ${key} qualification`);
    }
  }
};

const assertRecord = ({ contract, identity, record, vocabulary }) => {
  const parts = identity.split("/");
  if (
    parts.length !== vocabulary.length ||
    vocabulary.some((allowed, index) => !allowed.has(parts[index]))
  ) {
    throw new Error(
      `${describe(contract)} has an unrecognized identity ${identity}`,
    );
  }
  assertObject(
    record,
    `Missing ${contract.table} uncertainty record for ${identity}`,
  );
  const finite = (value) => typeof value === "number" && Number.isFinite(value);
  const weightsAreUsable = contract.weightFields.every(
    (field) => finite(record[field]) && record[field] >= 0,
  );
  const standardError = record[UNCERTAINTY_STATISTIC];
  if (
    !finite(standardError) ||
    standardError < 0 ||
    !weightsAreUsable ||
    !contract.supportsTheStatistic(record)
  ) {
    throw new Error(
      `${describe(contract)} has unusable statistics for ${identity}`,
    );
  }
};

/*
 * Deliberately no pinned record count. The sidecar contract lets the exported
 * record set grow - future category records arrive as their own group - so a
 * frozen number here would reject a legitimate refresh. The header's own
 * `record_count` is what a truncated download contradicts.
 */
export const validateUncertainty = (sidecar, contract) => {
  assertObject(sidecar, `${describe(contract)} is not an object`);
  const header = [
    ["schema", UNCERTAINTY_SCHEMA],
    ["table", contract.table],
    ["statistic", UNCERTAINTY_STATISTIC],
    ["n_semantics", contract.nSemantics],
  ];
  for (const expectation of header) {
    assertHeaderValue(sidecar, contract, expectation);
  }
  assertProvenance(sidecar, contract);
  assertQualifications(sidecar, contract);
  const vocabulary = readVocabulary(sidecar, contract);

  const totals = sidecar.record_groups?.totals;
  assertObject(totals, `${describe(contract)} is missing record_groups.totals`);
  assertObject(
    totals.records,
    `${describe(contract)} totals group has no records`,
  );
  const entries = Object.entries(totals.records);
  if (totals.record_count !== entries.length) {
    throw new Error(
      `${describe(contract)} declares ${totals.record_count} ` +
        `total records but carries ${entries.length}`,
    );
  }
  if (entries.length === 0) {
    throw new Error(`${describe(contract)} carries no records`);
  }
  for (const [identity, record] of entries) {
    assertRecord({ contract, identity, record, vocabulary });
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
export const assertMeansDigest = (sidecar, meansBody, contract) => {
  const digest = sha256(meansBody);
  if (sidecar.means_sha256 !== digest) {
    throw new Error(
      `The ${contract.table} uncertainty sidecar was exported against means ` +
        `${sidecar.means_sha256} but the downloaded means hash to ${digest}. ` +
        "The rolling release changed between the two downloads; rerun the update.",
    );
  }
};
