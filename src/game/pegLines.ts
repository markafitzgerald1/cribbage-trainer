import { CANONICAL_PLAY_HAND_KEYS } from "./playUncertainty";
import { MINIMUM_OBSERVATIONS } from "./uncertaintySidecar";
import { isFiniteNonNegative } from "../ui/isFiniteNonNegative";
import { isObject } from "../ui/isObject";

/*
 * The TypeScript counterpart of `decode_lines`, the reference reader in
 * simulate-cribbage-games' `play_lines` module (contract:
 * docs/pegging-lines.md). Every rejection returns null rather than throwing
 * or falling back: a rejected document, a missing key and an empty role are
 * all an unavailable capability, never a measured zero. Null is therefore
 * always tested explicitly, since a measured mean or standard error of
 * exactly 0 is a real value this reader keeps.
 *
 * The means digest is checked for shape only. Vite hands this module a parsed
 * document, so there are no published bytes to hash; the pairing is
 * established by `npm run test:vendored-tables`, which hashes the vendored
 * files themselves.
 */

const SCHEMA = "expected-play-lines.v1";
const RANKS = "A23456789TJQK";
const SHA256_DIGEST = /^[0-9a-f]{64}$/u;
const QUALIFICATION_KEYS = ["policy", "statistics", "missing"] as const;
const PROVENANCE_STRING_KEYS = ["generation_method", "policy_fingerprint"];
const HEADER_ROLES = ["Pone", "Dealer"];
const PONE_COLUMNS = ["lead", "n", "mu", "se"];
const DEALER_COLUMNS = [...PONE_COLUMNS, "response", "response_n"];
const COLUMN_SET_COUNT = 2;
const MEAN_DECIMALS = 3;
const STANDARD_ERROR_SIGNIFICANT_FIGURES = 2;
const PRECISION_FIELD_COUNT = 2;
const ROLE_COUNT = 2;
const NOTHING_BEFORE = -1;
const PONE_ROW_WIDTH = PONE_COLUMNS.length;
const DEALER_ROW_WIDTH = DEALER_COLUMNS.length;
const LAST_RANK_INDEX = RANKS.length - 1;

export interface PegLeadRow {
  readonly lead: number;
  readonly count: number;
  readonly mean: number | null;
  readonly standardError: number | null;
}

export interface PegDealerRow extends PegLeadRow {
  readonly response: number;
  readonly responseCount: number;
}

export type PegQualifications = Readonly<
  Record<(typeof QUALIFICATION_KEYS)[number], string>
>;

export interface PegLines {
  /** Statements the display may quote; each is non-empty. */
  readonly qualifications: PegQualifications;
  /** Whether the frozen policy had converged, which is `false` today. */
  readonly policyConverged: boolean;
  /** Pone's observed opening leads for a kept hand, or null if unavailable. */
  readonly poneRows: (handKey: string) => readonly PegLeadRow[] | null;
  /** Dealer's observed opponent leads and modal replies, or null. */
  readonly dealerRows: (handKey: string) => readonly PegDealerRow[] | null;
}

interface HandRows {
  readonly pone: readonly PegLeadRow[];
  readonly dealer: readonly PegDealerRow[];
}

const readField = (source: object, field: string): unknown =>
  Reflect.get(source, field) as unknown;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isQuotableText = (value: unknown): boolean =>
  typeof value === "string" && value.trim().length > 0;

const isIntegerBetween = (
  value: unknown,
  lower: number,
  upper: number,
): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= lower &&
  value <= upper;

const isStringList = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  expected.every((item, index) => value.at(index) === item);

const hasExpectedHeader = (document: object): boolean => {
  const columns = readField(document, "columns");
  const precision = readField(document, "precision");
  return (
    readField(document, "schema") === SCHEMA &&
    SHA256_DIGEST.test(String(readField(document, "means_sha256"))) &&
    readField(document, "ranks") === RANKS &&
    isStringList(readField(document, "roles"), HEADER_ROLES) &&
    Array.isArray(columns) &&
    columns.length === COLUMN_SET_COUNT &&
    isStringList(columns.at(0), PONE_COLUMNS) &&
    isStringList(columns.at(1), DEALER_COLUMNS) &&
    isObject(precision) &&
    Object.keys(precision).length === PRECISION_FIELD_COUNT &&
    readField(precision, "mu_decimals") === MEAN_DECIMALS &&
    readField(precision, "se_significant_figures") ===
      STANDARD_ERROR_SIGNIFICANT_FIGURES
  );
};

const readQualifications = (document: object): PegQualifications | null => {
  const source = readField(document, "qualifications");
  if (!isObject(source)) {
    return null;
  }
  const [policy, statistics, missing] = QUALIFICATION_KEYS.map((key) =>
    readField(source, key),
  );
  return [policy, statistics, missing].every(isQuotableText)
    ? ({ missing, policy, statistics } as PegQualifications)
    : null;
};

/*
 * Type, not value: `joint_policy_converged` is `false` on every document
 * published so far, so a truthiness test would reject exactly the files this
 * reader exists to read, and a converged policy would legitimately publish
 * `true` inside version 1 - an upstream improvement, not a malformation.
 */
const readPolicyConverged = (document: object): boolean | null => {
  const provenance = readField(document, "provenance");
  if (!isObject(provenance)) {
    return null;
  }
  const converged = readField(provenance, "joint_policy_converged");
  return typeof converged === "boolean" &&
    isIntegerBetween(
      readField(provenance, "seed"),
      Number.MIN_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
    ) &&
    PROVENANCE_STRING_KEYS.every((key) =>
      isNonEmptyString(readField(provenance, key)),
    )
    ? converged
    : null;
};

const hasSupportedMoments = (
  count: number,
  mean: unknown,
  standardError: unknown,
): boolean =>
  count < MINIMUM_OBSERVATIONS
    ? mean === null && standardError === null
    : Number.isFinite(mean) && isFiniteNonNegative(standardError);

const isRankInHand = (rank: number, handRanks: readonly string[]): boolean =>
  handRanks.includes(RANKS.charAt(rank));

const leadRowOf = (row: readonly unknown[]): PegLeadRow | null => {
  const [lead, count, mean, standardError] = row;
  return isIntegerBetween(lead, 0, LAST_RANK_INDEX) &&
    isIntegerBetween(count, 1, Number.MAX_SAFE_INTEGER) &&
    hasSupportedMoments(count, mean, standardError)
    ? {
        count,
        lead,
        mean: mean as number | null,
        standardError: standardError as number | null,
      }
    : null;
};

const dealerRowOf = (
  row: readonly unknown[],
  handRanks: readonly string[],
): PegDealerRow | null => {
  const base = leadRowOf(row);
  const [response, responseCount] = row.slice(PONE_ROW_WIDTH);
  return base !== null &&
    isIntegerBetween(response, 0, LAST_RANK_INDEX) &&
    isRankInHand(response, handRanks) &&
    isIntegerBetween(responseCount, 1, base.count)
    ? { ...base, response, responseCount }
    : null;
};

/*
 * Rows must ascend strictly by lead, which also rules out a duplicated lead.
 * A single failing row rejects the whole document rather than dropping the
 * row, since a document with one malformed cell is not one the contract
 * describes.
 */
const readRows = <Row extends PegLeadRow>(
  value: unknown,
  rowOf: (row: readonly unknown[]) => Row | null,
  width: number,
): readonly Row[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  const rows: Row[] = [];
  let previousLead = NOTHING_BEFORE;
  for (const row of value as unknown[]) {
    const parsed =
      Array.isArray(row) && row.length === width
        ? rowOf(row as unknown[])
        : null;
    if (parsed === null || parsed.lead <= previousLead) {
      return null;
    }
    previousLead = parsed.lead;
    rows.push(parsed);
  }
  return rows;
};

const readHandRows = (
  handKey: string,
  entry: unknown,
): [string, HandRows] | null => {
  if (!Array.isArray(entry) || entry.length !== ROLE_COUNT) {
    return null;
  }
  const handRanks = handKey.split("_");
  const pone = readRows(
    entry.at(0),
    (row) => {
      const parsed = leadRowOf(row);
      return parsed !== null && isRankInHand(parsed.lead, handRanks)
        ? parsed
        : null;
    },
    PONE_ROW_WIDTH,
  );
  const dealer = readRows(
    entry.at(1),
    (row) => dealerRowOf(row, handRanks),
    DEALER_ROW_WIDTH,
  );
  return pone === null || dealer === null ? null : [handKey, { dealer, pone }];
};

/*
 * Keys are checked against the contract's own derivation, never against the
 * vendored means table: the two hold the same 1,820 hands in different
 * orders, so the table's order would reject every published file. Requiring
 * strictly increasing positions in the canonical list enforces the order and
 * rules out a duplicate in one comparison, and a bounded run's subset is
 * still legal because the reference reader allows one.
 */
const canonicalPositions: ReadonlyMap<string, number> = new Map(
  CANONICAL_PLAY_HAND_KEYS.map((key, index) => [key, index]),
);

const readHands = (document: object): ReadonlyMap<string, HandRows> | null => {
  const keys = readField(document, "keys");
  const entries = readField(document, "entries");
  if (
    !Array.isArray(keys) ||
    !Array.isArray(entries) ||
    keys.length !== entries.length
  ) {
    return null;
  }
  const hands = new Map<string, HandRows>();
  let previousPosition = NOTHING_BEFORE;
  for (const [index, key] of (keys as unknown[]).entries()) {
    const position =
      typeof key === "string"
        ? (canonicalPositions.get(key) ?? NOTHING_BEFORE)
        : NOTHING_BEFORE;
    const hand =
      position > previousPosition
        ? readHandRows(key as string, entries.at(index))
        : null;
    if (hand === null) {
      return null;
    }
    previousPosition = position;
    hands.set(...hand);
  }
  return hands;
};

function usableRows<Row>(rows: readonly Row[]): readonly Row[] | null {
  return rows.length === 0 ? null : rows;
}

export const parsePegLines = (document: unknown): PegLines | null => {
  if (!isObject(document) || !hasExpectedHeader(document)) {
    return null;
  }
  const qualifications = readQualifications(document);
  const policyConverged = readPolicyConverged(document);
  const hands = readHands(document);
  if (qualifications === null || policyConverged === null || hands === null) {
    return null;
  }
  return {
    dealerRows: (handKey) => usableRows(hands.get(handKey)?.dealer ?? []),
    policyConverged,
    poneRows: (handKey) => usableRows(hands.get(handKey)?.pone ?? []),
    qualifications,
  };
};
