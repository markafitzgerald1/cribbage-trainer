import {
  type TableIdentity,
  normalizeTableIdentity,
  sameTableIdentity,
} from "../game/tableIdentity";
import type { StoredTally } from "./discardTally";

export const resolveTableIdentity = (
  value: unknown,
  identities: readonly unknown[],
): TableIdentity | null =>
  normalizeTableIdentity(
    typeof value === "string"
      ? identities.find((_, index) => String(index) === value)
      : value,
  );

/*
 * A reference this build cannot resolve is a later build's, not an absent one.
 * It is kept beside the typed (null) identity so the next write can put the
 * stored value back, while every consumer keeps reading the identity as unavailable.
 */
export interface UnreadableTableIdentity {
  readonly unreadableTableIdentity?: unknown;
}

const pointsPastPool = (value: unknown, identities: readonly unknown[]) =>
  typeof value === "string" &&
  !identities.some((_, index) => String(index) === value);

export const resolveStoredReference = (
  value: unknown,
  identities: readonly unknown[],
): UnreadableTableIdentity & {
  readonly tableIdentity: TableIdentity | null;
} => {
  const tableIdentity = resolveTableIdentity(value, identities);
  // A reference past the pool names nothing, and the pool grows by appending, so keeping it would later point at an identity it never meant.
  return tableIdentity === null &&
    value !== null &&
    typeof value !== "undefined" &&
    !pointsPastPool(value, identities)
    ? { tableIdentity, unreadableTableIdentity: value }
    : { tableIdentity };
};

// This build sets `unreadableTableIdentity` in memory only, never in storage.
// A stored key with that name is dropped so the writer cannot copy it out.
export const withoutUnreadableReference = <T extends object>(stored: T): T =>
  Object.fromEntries(
    Object.entries(stored).filter(([key]) => key !== "unreadableTableIdentity"),
  ) as T;

const ATTEMPT_FIELDS: readonly string[] = [
  "handKey",
  "discardKey",
  "at",
  "order",
  "tableIdentity",
  "expectedPointsLoss",
  "isOptimal",
  "outcome",
  "basis",
];

// Only the transport interns identities; callers always see the complete digest pair.
export const encodeTableIdentities = (tally: StoredTally): unknown => {
  const tableIdentities = [...(tally.tableIdentities ?? [])];
  function encode<
    T extends {
      readonly tableIdentity?: TableIdentity | null;
    } & UnreadableTableIdentity,
  >({ unreadableTableIdentity, ...record }: T) {
    const identity = normalizeTableIdentity(record.tableIdentity);
    if (identity === null) {
      return { ...record, tableIdentity: unreadableTableIdentity ?? null };
    }
    let index = tableIdentities.findIndex(
      (known) =>
        normalizeTableIdentity(known) !== null &&
        sameTableIdentity(known as TableIdentity, identity),
    );
    if (index < 0) {
      index = tableIdentities.push(identity) - 1;
    }
    return { ...record, tableIdentity: String(index) };
  }
  const records = tally.records.map(encode);
  const attemptLog = tally.attemptLog?.map((entry) => {
    const encoded = encode(entry);
    if (Object.keys(encoded).some((key) => !ATTEMPT_FIELDS.includes(key))) {
      return encoded;
    }
    return [
      encoded.handKey,
      encoded.discardKey,
      encoded.at,
      encoded.order,
      encoded.tableIdentity,
      encoded.expectedPointsLoss,
      encoded.isOptimal,
      encoded.outcome,
      encoded.basis,
    ];
  });
  return {
    ...tally,
    records,
    ...(attemptLog ? { attemptLog } : {}),
    tableIdentities,
  };
};
