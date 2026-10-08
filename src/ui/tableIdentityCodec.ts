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
  const records = tally.records.map((record) => {
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
  });
  return { ...tally, records, tableIdentities };
};
