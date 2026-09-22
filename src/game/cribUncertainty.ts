import { STARTER_RANKS } from "./expectedCribPoints";
import { isFiniteNonNegative } from "../ui/isFiniteNonNegative";
import { isObject } from "../ui/isObject";

/*
 * The TypeScript counterpart of `decode_sidecar`, the reference reader in
 * simulate-cribbage-games' docs/uncertainty-sidecars.md. Every rejection
 * returns null rather than throwing or falling back, because the contract is
 * explicit that a missing or rejected sidecar is an unavailable capability
 * and never a measured zero - a supported measured se of 0 is a real value
 * this reader keeps.
 */

const SCHEMA = "expected-points-uncertainty.v1";
const TABLE = "crib";
const STATISTIC = "reported_marginal_se";
const N_SEMANTICS = "sum_weights";

const QUALIFICATION_KEYS = ["crib", "play", "scope"] as const;

/*
 * The digests naming the means this sidecar was exported against and the full
 * artifact it came from. Checked for shape only, which is the most a browser
 * can do: Vite hands this module a parsed table, not the published bytes, so
 * there is nothing here to hash against. What establishes the pairing is
 * `npm run test:vendored-tables`, which hashes the vendored file itself and
 * runs on every commit, in CI, and on the production deploy path. Refusing a
 * document that omits either is still worth doing - a sidecar without them is
 * not one this contract describes, whatever its records look like, and the
 * same goes for one carrying no provenance.
 */
const SHA256_DIGEST = /^[0-9a-f]{64}$/u;
const DIGEST_FIELDS = ["means_sha256", "source_full_sha256"];

/*
 * Present on every crib record, and both are validated even though only the
 * standard error is read: a document whose weights are missing or absurd is
 * not one whose standard errors should be trusted either.
 */
const WEIGHT_FIELDS = ["n", "sum_w2"] as const;

/*
 * The exporter omits a record whose weights cannot support the statistic it
 * would carry: fewer than two effective observations, or a non-positive
 * weighted-variance denominator `n - sum_w2 / n`. A record that carries one
 * anyway is malformed rather than informative, so it is refused here too -
 * exposing a standard error the exporter would have discarded is exactly the
 * kind of number this file exists to keep off the screen. Every published
 * record clears both by a wide margin (the smallest `n` is 5,663 and the
 * smallest denominator 5,662.98), so this rejects nothing that ships today.
 */
const MINIMUM_OBSERVATIONS = 2;

/*
 * Version 1 pins these, so a sidecar does not get to declare its own. A
 * document that did would still parse and its identities would still check
 * out against its own lists - and then every real lookup would miss, leaving
 * the bound unavailable for reasons no error names.
 *
 * The rank list is the app's own `STARTER_RANKS`, in the order the contract
 * requires, rather than a second copy that could drift from it, and the key
 * sequence is derived from it the way the contract describes: both ranks in
 * rank order, `Suited` before `Unsuited`, and no suited pair, since two cards
 * of one rank cannot share a suit. Comparing against that whole sequence
 * rather than against a shape is what rejects a duplicate, a reordering, or
 * an omitted key - each of which would quietly cost one row its bound.
 */
const CANONICAL_ROLES = ["Dealer", "Pone"];
const CANONICAL_SLOTS = [
  "total",
  "matching_discard_suit",
  "non_matching_discard_suit",
  "matching_rank_1_suit",
  "matching_rank_2_suit",
];

export const CANONICAL_DISCARD_KEYS: readonly string[] = STARTER_RANKS.flatMap(
  (first, index) =>
    STARTER_RANKS.slice(index).flatMap((second) =>
      first === second
        ? [`${first}_${second}_Unsuited`]
        : [`${first}_${second}_Suited`, `${first}_${second}_Unsuited`],
    ),
);

type IdentityVocabulary = readonly ReadonlySet<string>[];

type RecordEntries = readonly (readonly [string, unknown])[];

/*
 * Narrower than ReadonlyMap on purpose: lookup is the whole contract, and a
 * test or story can stand in a rule rather than enumerate 9,076 identities.
 */
export interface CribStandardErrors {
  readonly get: (identity: string) => number | undefined;
}

export interface CribUncertainty {
  readonly totals: CribStandardErrors;
}

export interface CribRecordIdentityParts {
  readonly discardKey: string;
  readonly role: string;
  readonly slot: string;
  readonly starterRank: string;
}

export const cribRecordIdentity = ({
  discardKey,
  role,
  slot,
  starterRank,
}: CribRecordIdentityParts): string =>
  `${discardKey}/${role}/${starterRank}/${slot}`;

/*
 * Coalesces on absence alone rather than on a truthiness test, so a measured
 * standard error of exactly 0 reads back as the zero it is, not as absent.
 */
export const cribStandardError = (
  uncertainty: CribUncertainty,
  identity: string,
): number | null => uncertainty.totals.get(identity) ?? null;

const readString = (source: object, field: string): string | null => {
  const value = Reflect.get(source, field) as unknown;
  return typeof value === "string" && value.length > 0 ? value : null;
};

const readStringList = (
  source: object,
  field: string,
): readonly string[] | null => {
  const value = Reflect.get(source, field) as unknown;
  return Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string")
    ? value
    : null;
};

const hasExpectedHeader = (document: object): boolean =>
  readString(document, "schema") === SCHEMA &&
  readString(document, "table") === TABLE &&
  readString(document, "statistic") === STATISTIC &&
  readString(document, "n_semantics") === N_SEMANTICS &&
  DIGEST_FIELDS.every((field) =>
    SHA256_DIGEST.test(readString(document, field) ?? ""),
  ) &&
  isObject(Reflect.get(document, "provenance") as unknown);

/*
 * Only the presence of each key is part of the wire contract; the wording is
 * not, so clarifying a qualification upstream must not orphan this reader.
 */
const hasQualifications = (document: object): boolean => {
  const qualifications = Reflect.get(document, "qualifications") as unknown;
  return (
    isObject(qualifications) &&
    QUALIFICATION_KEYS.every((key) => readString(qualifications, key) !== null)
  );
};

const isCanonical = (
  list: readonly string[],
  expected: readonly string[],
): boolean =>
  list.length === expected.length &&
  list.every((item, index) => item === expected.at(index));

// Returned in the order a record identity spells them: key, role, rank, slot.
const readVocabulary = (document: object): IdentityVocabulary | null => {
  const keys = readStringList(document, "keys");
  const roles = readStringList(document, "roles");
  const ranks = readStringList(document, "ranks");
  const slots = readStringList(document, "slots");
  if (keys === null || roles === null || ranks === null || slots === null) {
    return null;
  }
  if (
    !isCanonical(keys, CANONICAL_DISCARD_KEYS) ||
    !isCanonical(roles, CANONICAL_ROLES) ||
    !isCanonical(ranks, STARTER_RANKS) ||
    !isCanonical(slots, CANONICAL_SLOTS)
  ) {
    return null;
  }
  return [new Set(keys), new Set(roles), new Set(ranks), new Set(slots)];
};

// Named so the index is asserted once, under the length check that makes it sound; a file-scoped disable is prohibited here.
const partAt = (parts: readonly string[], index: number): string =>
  parts.at(index) as string;

const isKnownIdentity = (
  identity: string,
  vocabulary: IdentityVocabulary,
): boolean => {
  const parts = identity.split("/");
  return (
    parts.length === vocabulary.length &&
    vocabulary.every((allowed, index) => allowed.has(partAt(parts, index)))
  );
};

const supportsTheStatistic = (weight: number, squaredWeight: number): boolean =>
  weight >= MINIMUM_OBSERVATIONS && weight - squaredWeight / weight > 0;

const readRecordStandardError = (record: unknown): number | null => {
  if (!isObject(record)) {
    return null;
  }
  const standardError = Reflect.get(record, STATISTIC) as unknown;
  const [weight, squaredWeight] = WEIGHT_FIELDS.map(
    (field) => Reflect.get(record, field) as unknown,
  );
  if (!isFiniteNonNegative(weight) || !isFiniteNonNegative(squaredWeight)) {
    return null;
  }
  if (!supportsTheStatistic(weight, squaredWeight)) {
    return null;
  }
  return isFiniteNonNegative(standardError) ? standardError : null;
};

/*
 * Unknown record groups are ignored on purpose: the contract's additive
 * extension boundary puts future category records in their own group, so a
 * version-1 reader must still read the original totals when they arrive.
 */
const readTotalEntries = (document: object): RecordEntries | null => {
  const groups = Reflect.get(document, "record_groups") as unknown;
  if (!isObject(groups)) {
    return null;
  }
  const totals = Reflect.get(groups, "totals") as unknown;
  if (!isObject(totals)) {
    return null;
  }
  const records = Reflect.get(totals, "records") as unknown;
  if (!isObject(records)) {
    return null;
  }
  const entries = Object.entries(records);
  return Reflect.get(totals, "record_count") === entries.length &&
    entries.length > 0
    ? entries
    : null;
};

export const parseCribUncertainty = (
  value: unknown,
): CribUncertainty | null => {
  if (!isObject(value)) {
    return null;
  }
  if (!hasExpectedHeader(value)) {
    return null;
  }
  if (!hasQualifications(value)) {
    return null;
  }
  const vocabulary = readVocabulary(value);
  if (vocabulary === null) {
    return null;
  }
  const entries = readTotalEntries(value);
  if (entries === null) {
    return null;
  }

  const totals = new Map<string, number>();
  for (const [identity, record] of entries) {
    const standardError = readRecordStandardError(record);
    if (standardError === null || !isKnownIdentity(identity, vocabulary)) {
      return null;
    }
    totals.set(identity, standardError);
  }

  return { totals };
};
