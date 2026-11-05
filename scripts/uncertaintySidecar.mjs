import {
  CRIB_V2_SAMPLE_UNIT,
  CRIB_V2_SCHEMA,
  CRIB_V4_METHOD,
  validCribV2Header,
  validCribV2Identity,
  validCribV2Record,
} from "../src/game/cribUncertaintyV2.mjs";
import { artifactNumber, parseArtifactJson } from "./artifactJson.mjs";
import { createHash } from "node:crypto";

/*
 * The version-1 uncertainty sidecar contract, checked before either vendored
 * file is written. This runs the whole contract rather than just the header,
 * because a sidecar the browser's reader would reject is one that silently
 * removes every figure from the next build.
 *
 * The browser's reader is TypeScript (src/game/uncertaintySidecar.ts) and
 * this entrypoint also checks exact means bytes and client metadata. Both
 * readers share the v2 semantic validator.
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
  // Crib quotes no policy item: its qualification is about the weighted estimator.
  requiredNullFields: [],
  requiredProvenance: [],
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
  /*
   * The contract states that play provenance retains its policy fingerprint
   * and `joint_policy_converged`, and the trainer's pegging copy rests on the
   * second of them.
   */
  requiredNullFields: ["policy_uncertainty"],
  requiredProvenance: [
    ["joint_policy_converged", "boolean"],
    ["policy_fingerprint", "string"],
  ],
  /*
   * Play weights are a count of simulations and carry no `sum_w2` to bound.
   * The whole-number check mirrors the browser reader's: a count of
   * simulations that is not a whole number is not a count.
   */
  supportsTheStatistic: (record) =>
    Number.isInteger(record.n) && record.n >= MINIMUM_OBSERVATIONS,
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
    const value = sidecar[field];
    if (typeof value !== "string" || !SHA256_DIGEST.test(value)) {
      throw new Error(`${describe(contract)} names no usable ${field}`);
    }
  }
  assertObject(
    sidecar.provenance,
    `${describe(contract)} carries no provenance`,
  );
  /*
   * Type, not value: play's `joint_policy_converged` is `false` on every
   * published document, so a truthiness test would reject exactly the
   * sidecars this checks - and a converged policy would legitimately publish
   * `true` inside version 1, which is an upstream improvement rather than a
   * malformation.
   */
  for (const [field, type] of contract.requiredProvenance) {
    if (
      !Object.hasOwn(sidecar.provenance, field) ||
      typeof sidecar.provenance[field] !== type ||
      sidecar.provenance[field] === ""
    ) {
      throw new Error(
        `${describe(contract)} provenance has no usable ${field}`,
      );
    }
  }
  /*
   * The contract publishes these as `null` and needs a new schema to change
   * them. A value would mean the trainer's copy is hiding a quantity the
   * document carries.
   */
  for (const field of contract.requiredNullFields) {
    if (!Object.hasOwn(sidecar, field) || sidecar[field] !== null) {
      throw new Error(
        `${describe(contract)} does not publish ${field} as unavailable`,
      );
    }
  }
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

const assertRecord = ({ contract, identity, record, vocabulary, isCribV2 }) => {
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
  if (isCribV2) {
    if (!validCribV2Record(record) || !validCribV2Identity(identity)) {
      throw new Error(
        `${describe(contract)} has unusable statistics for ${identity}`,
      );
    }
    return;
  }
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
const assertSchemaQualifications = (sidecar, contract, isCribV2) => {
  if (isCribV2) {
    if (!validCribV2Header(sidecar)) {
      throw new Error(
        `${describe(contract)} has invalid v2 provenance or scope`,
      );
    }
  } else {
    assertQualifications(sidecar, contract);
    if (
      contract.table === "crib" &&
      sidecar.provenance.generation_method === CRIB_V4_METHOD
    ) {
      throw new Error("Version 4 crib provenance requires the v2 sidecar");
    }
  }
};

export const validateUncertainty = (sidecar, contract) => {
  assertObject(sidecar, `${describe(contract)} is not an object`);
  const isCribV2 =
    contract.table === "crib" && sidecar.schema === CRIB_V2_SCHEMA;
  const header = [
    ["schema", isCribV2 ? CRIB_V2_SCHEMA : UNCERTAINTY_SCHEMA],
    ["table", contract.table],
    ["statistic", UNCERTAINTY_STATISTIC],
    ["n_semantics", isCribV2 ? CRIB_V2_SAMPLE_UNIT : contract.nSemantics],
  ];
  for (const expectation of header) {
    assertHeaderValue(sidecar, contract, expectation);
  }
  assertProvenance(sidecar, contract);
  assertSchemaQualifications(sidecar, contract, isCribV2);
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
    assertRecord({ contract, identity, isCribV2, record, vocabulary });
  }
};

// toFixed rounds exact halfway cases away from zero. A binary64 value
// exactly halfway at four places is an odd multiple of 1/32.
const roundCribMean = (mean) => {
  if (typeof mean === "bigint") return mean;
  if (Number.isSafeInteger(mean * 32) && Math.abs((mean * 32) % 2) === 1) {
    // The integer numerator preserves ties even where scaling a double loses bits.
    const lower = (BigInt(Math.abs(mean * 32)) * 625n) / 2n;
    const rounded = lower + (lower % 2n);
    const sign = mean < 0 ? "-" : "";
    const fraction = (rounded % 10000n).toString().padStart(4, "0");
    return Number(`${sign}${rounded / 10000n}.${fraction}`);
  }
  return Number(mean.toFixed(4));
};

// Python compares integers and floats by value without rounding the integer.
const comparableMean = (mean) => (Number.isInteger(mean) ? BigInt(mean) : mean);

const assertCribV2Buckets = (key, table) => {
  if (Object.keys(table ?? {}).length !== CANONICAL_ROLES.length) {
    throw new Error(`Invalid v4 crib roles for ${key}`);
  }
  for (const role of CANONICAL_ROLES) {
    const cuts = Reflect.get(table, role);
    if (Object.keys(cuts ?? {}).length !== CANONICAL_RANKS.length) {
      throw new Error(`Invalid v4 starter ranks for ${key}/${role}`);
    }
    for (const rank of CANONICAL_RANKS) {
      const root = Reflect.get(cuts, rank);
      if (root && Object.hasOwn(root, "starter_suit_relation")) {
        assertObject(
          root.starter_suit_relation,
          `Invalid v4 suit relations for ${key}/${role}/${rank}`,
        );
      }
      const relations = Object.entries(root?.starter_suit_relation ?? {});
      if (
        !Number.isFinite(root?.mu) ||
        relations.some(
          ([slot, bucket]) =>
            slot === "total" ||
            !validCribV2Identity(`${key}/${role}/${rank}/${slot}`) ||
            !Number.isFinite(bucket?.mu),
        )
      ) {
        throw new Error(`Invalid v4 crib means for ${key}/${role}/${rank}`);
      }
    }
  }
};

const assertV2Means = (sidecar, means) => {
  if (
    Object.keys(means).length !== CANONICAL_DISCARD_KEYS.length + 1 ||
    !CANONICAL_DISCARD_KEYS.every((key) => Object.hasOwn(means, key))
  ) {
    throw new Error("Version 4 crib means lack the canonical discard keys");
  }
  for (const key of CANONICAL_DISCARD_KEYS) {
    assertCribV2Buckets(key, Reflect.get(means, key));
  }
  const { records } = sidecar.record_groups.totals;
  for (const [identity, record] of Object.entries(records)) {
    const [key, role, rank, slot] = identity.split("/");
    const root = means[key]?.[role]?.[rank];
    const bucket =
      slot === "total" ? root : root?.starter_suit_relation?.[slot];
    if (
      comparableMean(artifactNumber(bucket, "mu")) !==
      comparableMean(roundCribMean(artifactNumber(record, "mu")))
    ) {
      throw new Error(`Crib uncertainty mean differs for ${identity}`);
    }
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
  const means = parseArtifactJson(meansBody);
  if (contract.table === "crib") {
    const metadata = Reflect.get(means, "__metadata__");
    const isCribV2 = sidecar.schema === CRIB_V2_SCHEMA;
    if (
      isCribV2 !== (metadata?.generation_method === CRIB_V4_METHOD) ||
      (isCribV2 &&
        ["seed", "generation"].some(
          (field) => metadata[field] !== sidecar.provenance[field],
        ))
    ) {
      throw new Error(
        "Crib means and uncertainty versions or provenance differ",
      );
    }
    if (isCribV2) {
      assertV2Means(sidecar, means);
    }
  }
};
