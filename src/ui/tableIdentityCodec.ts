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

// Only the transport interns identities; callers always see the complete digest pair.
export const encodeTableIdentities = (tally: StoredTally): unknown => {
  const tableIdentities = [...(tally.tableIdentities ?? [])];
  function encode<T extends { readonly tableIdentity?: TableIdentity | null }>(
    record: T,
  ) {
    const identity = normalizeTableIdentity(record.tableIdentity);
    let reference: string | null = null;
    if (identity !== null) {
      let index = tableIdentities.findIndex(
        (known) =>
          normalizeTableIdentity(known) !== null &&
          sameTableIdentity(known as TableIdentity, identity),
      );
      if (index < 0) {
        index = tableIdentities.push(identity) - 1;
      }
      reference = String(index);
    }
    return { ...record, tableIdentity: reference };
  }
  const records = tally.records.map(encode);
  const attemptLog = tally.attemptLog?.map(encode);
  return {
    ...tally,
    records,
    ...(attemptLog ? { attemptLog } : {}),
    tableIdentities,
  };
};
