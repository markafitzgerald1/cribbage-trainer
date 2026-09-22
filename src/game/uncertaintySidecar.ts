import { CribRole } from "./expectedCribPoints";
import { isFiniteNonNegative } from "../ui/isFiniteNonNegative";
import { isObject } from "../ui/isObject";

/*
 * The TypeScript counterpart of `decode_sidecar`, the reference reader in
 * simulate-cribbage-games' docs/uncertainty-sidecars.md. One schema describes
 * both published sidecars, so one reader reads both and each table supplies
 * only what version 1 pins differently: the table name, the weight semantics,
 * the four vocabulary lists, which of those an identity spells, and which
 * weights have to support the statistic.
 *
 * Every rejection returns null rather than throwing or falling back, because
 * the contract is explicit that a missing or rejected sidecar is an
 * unavailable capability and never a measured zero - a supported measured se
 * of 0 is a real value this reader keeps.
 */

const SCHEMA = "expected-points-uncertainty.v1";
const STATISTIC = "reported_marginal_se";

const QUALIFICATION_KEYS = ["crib", "play", "scope"] as const;

/*
 * The digests naming the means this sidecar was exported against and the full
 * artifact it came from. Checked for shape only, which is the most a browser
 * can do: Vite hands this module a parsed document, not the published bytes,
 * so there is nothing here to hash against. What establishes the pairing is
 * `npm run test:vendored-tables`, which hashes the vendored files themselves
 * and runs on every commit, in CI, and on the production deploy path.
 * Refusing a document that omits either is still worth doing - a sidecar
 * without them is not one this contract describes, whatever its records look
 * like, and the same goes for one carrying no provenance.
 */
const SHA256_DIGEST = /^[0-9a-f]{64}$/u;
const DIGEST_FIELDS = ["means_sha256", "source_full_sha256"];

/*
 * The exporter omits a record whose weights cannot support the statistic it
 * would carry. A record that carries one anyway is malformed rather than
 * informative, so it is refused here too - exposing a standard error the
 * exporter would have discarded is exactly the kind of number this file
 * exists to keep off the screen.
 */
export const MINIMUM_OBSERVATIONS = 2;

/*
 * Version 1 pins every one of these per table, so a sidecar does not get to
 * declare its own. A document that did would still parse and its identities
 * would still check out against its own lists - and then every real lookup
 * would miss, leaving the figure unavailable for reasons no error names.
 * Named in the order a crib record identity spells them; play omits `ranks`,
 * which the contract publishes as an empty list.
 */
export const VOCABULARY_FIELDS = ["keys", "roles", "ranks", "slots"] as const;

/*
 * The one list version 1 pins identically for both tables, and the app's own
 * seats rather than a second spelling of them that could drift.
 *
 * `Object.values` makes the published order depend on this object's
 * declaration order, and a reorder made for unrelated reasons would leave
 * both readers rejecting every shipped sidecar with no error naming the
 * cause. `uncertaintySidecar.test.ts` pins the sequence against the
 * contract's own literal so that edit fails where it is made.
 */
export const CANONICAL_ROLES: readonly string[] = Object.values(CribRole);

export type VocabularyField = (typeof VOCABULARY_FIELDS)[number];

export interface UncertaintyContract {
  /** The identity parts, in the order the identity spells them. */
  readonly identityFields: readonly VocabularyField[];
  readonly nSemantics: string;
  /**
   * Called only once every `weightFields` entry has been read off the record
   * and checked to be a finite non-negative number, which is what lets it
   * read them back as plain numbers.
   */
  readonly supportsTheStatistic: (record: object) => boolean;
  readonly table: string;
  /** Every list version 1 pins for this table, empty ones included. */
  readonly vocabulary: Readonly<Record<VocabularyField, readonly string[]>>;
  readonly weightFields: readonly string[];
}

type IdentityVocabulary = readonly ReadonlySet<string>[];

type RecordEntries = readonly (readonly [string, unknown])[];

/*
 * Narrower than ReadonlyMap on purpose: lookup is the whole contract, and a
 * test or story can stand in a rule rather than enumerate 9,076 identities.
 */
export interface StandardErrors {
  readonly get: (identity: string) => number | undefined;
}

export interface Uncertainty {
  readonly totals: StandardErrors;
}

/*
 * Coalesces on absence alone rather than on a truthiness test, so a measured
 * standard error of exactly 0 reads back as the zero it is, not as absent.
 */
export const uncertaintyStandardError = (
  uncertainty: Uncertainty,
  identity: string,
): number | null => uncertainty.totals.get(identity) ?? null;

/*
 * Sound only where `parseUncertaintySidecar` has already established that the
 * field holds a finite non-negative number, which is why a contract's
 * `supportsTheStatistic` is the only caller. Reading the weights back by name
 * rather than by position keeps a two-weight rule from having to index a
 * tuple whose length no type carries.
 */
export const recordWeight = (record: object, field: string): number => {
  const value = Reflect.get(record, field) as unknown;
  return value as number;
};

const readString = (source: object, field: string): string | null => {
  const value = Reflect.get(source, field) as unknown;
  return typeof value === "string" && value.length > 0 ? value : null;
};

const hasExpectedHeader = (
  document: object,
  contract: UncertaintyContract,
): boolean =>
  readString(document, "schema") === SCHEMA &&
  readString(document, "table") === contract.table &&
  readString(document, "statistic") === STATISTIC &&
  readString(document, "n_semantics") === contract.nSemantics &&
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

/*
 * Compared against the whole canonical sequence rather than against a shape,
 * which is what rejects a duplicate, a reordering, or an omission - each of
 * which would quietly cost one row its figure. An empty canonical list is a
 * list the document must publish empty, so play's `ranks: []` is required
 * rather than merely tolerated.
 */
const isCanonicalList = (
  value: unknown,
  expected: readonly string[],
): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  value.every((item, index) => item === expected.at(index));

/*
 * Named so the lookup is asserted once: `vocabulary` is keyed by exactly the
 * fields `VocabularyField` admits, which a computed member access cannot
 * state and a file-scoped disable is prohibited from silencing.
 */
const canonicalList = (
  contract: UncertaintyContract,
  field: VocabularyField,
): readonly string[] => Reflect.get(contract.vocabulary, field);

const readVocabulary = (
  document: object,
  contract: UncertaintyContract,
): IdentityVocabulary | null => {
  const declaresCanonicalLists = VOCABULARY_FIELDS.every((field) =>
    isCanonicalList(
      Reflect.get(document, field) as unknown,
      canonicalList(contract, field),
    ),
  );
  return declaresCanonicalLists
    ? contract.identityFields.map(
        (field) => new Set(canonicalList(contract, field)),
      )
    : null;
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

const readRecordStandardError = (
  record: unknown,
  contract: UncertaintyContract,
): number | null => {
  if (!isObject(record)) {
    return null;
  }
  const weights = contract.weightFields.map(
    (field) => Reflect.get(record, field) as unknown,
  );
  if (!weights.every(isFiniteNonNegative)) {
    return null;
  }
  if (!contract.supportsTheStatistic(record)) {
    return null;
  }
  const standardError = Reflect.get(record, STATISTIC) as unknown;
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

export const parseUncertaintySidecar = (
  value: unknown,
  contract: UncertaintyContract,
): Uncertainty | null => {
  if (!isObject(value)) {
    return null;
  }
  if (!hasExpectedHeader(value, contract)) {
    return null;
  }
  if (!hasQualifications(value)) {
    return null;
  }
  const vocabulary = readVocabulary(value, contract);
  if (vocabulary === null) {
    return null;
  }
  const entries = readTotalEntries(value);
  if (entries === null) {
    return null;
  }

  const totals = new Map<string, number>();
  for (const [identity, record] of entries) {
    const standardError = readRecordStandardError(record, contract);
    if (standardError === null || !isKnownIdentity(identity, vocabulary)) {
      return null;
    }
    totals.set(identity, standardError);
  }

  return { totals };
};
