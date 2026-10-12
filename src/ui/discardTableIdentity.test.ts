/* jscpd:ignore-start */
import {
  MAX_RECORDS,
  clearDiscardTally,
  discardTallyKey,
  readTallyForDisplay,
  recordDiscardDecision,
} from "./discardTally";
import { decisionOf, storeRaw, storedWith } from "./discardTally.test.common";
import { describe, expect, it } from "@jest/globals";
import { encodeTableIdentities } from "./tableIdentityCodec";

const identity = {
  crib: { means_sha256: "a".repeat(64) },
  play: { means_sha256: "b".repeat(64) },
};

describe("decision table provenance", () => {
  it("stores a capped history more compactly without losing the full digest pair", () => {
    clearDiscardTally();
    const records = Array.from({ length: MAX_RECORDS }, (_, index) =>
      decisionOf({
        handKey: `AH,2H,3H,4H,5H,6H|Dealer|${index}`,
        recencyAt: 1700000000000 + index,
        sortOrder: "deal-order",
        tableIdentity: identity,
      }),
    );
    const tally = { ...readTallyForDisplay(), records };
    const direct = JSON.stringify(tally);
    const interned = JSON.stringify(encodeTableIdentities(tally));

    expect(interned.length).toBeLessThan(direct.length);

    storeRaw(interned);

    expect(readTallyForDisplay().records).toHaveLength(MAX_RECORDS);
    expect(
      readTallyForDisplay().records[MAX_RECORDS - 1]?.tableIdentity,
    ).toStrictEqual(identity);
  });

  it("preserves reserved attempt/admission data and their registry references on ordinary writes", () => {
    const attemptLog = [{ handKey: "reserved", tableIdentity: "1" }];
    storeRaw(
      JSON.stringify(
        storedWith({
          attemptLog,
          records: [
            { ...decisionOf(), recordedAdmission: { verdict: "reserved" } },
          ],
          tableIdentities: [null, identity],
          version: 8,
        }),
      ),
    );
    recordDiscardDecision({
      ...decisionOf({ handKey: "new" }),
      tableIdentity: identity,
    });
    const decoded = readTallyForDisplay();

    expect(decoded.attemptLog).toStrictEqual(attemptLog);
    expect(decoded.tableIdentities).toStrictEqual([null, identity]);
    expect(decoded.records[0]?.recordedAdmission).toStrictEqual({
      verdict: "reserved",
    });
    expect(decoded.records[1]?.tableIdentity).toStrictEqual(identity);
  });

  it("reads a v7 identity as unknown without writing migration bytes", () => {
    const bytes = JSON.stringify(
      storedWith({
        records: [
          Object.fromEntries(
            Object.entries(decisionOf()).filter(
              ([key]) => key !== "tableIdentity",
            ),
          ),
        ],
        version: 7,
      }),
    );
    storeRaw(bytes);

    expect(readTallyForDisplay().records[0]?.tableIdentity).toBeNull();
    expect(localStorage.getItem(discardTallyKey)).toBe(bytes);

    recordDiscardDecision(decisionOf({ handKey: "new" }));

    expect(
      (
        JSON.parse(localStorage.getItem(discardTallyKey) as string) as {
          version: number;
        }
      ).version,
    ).toBe(8);
  });

  it("keeps v9 bytes after display and an attempted decision write", () => {
    const bytes = JSON.stringify(storedWith({ version: 9 }));
    storeRaw(bytes);

    expect(readTallyForDisplay().records).toStrictEqual([]);

    recordDiscardDecision(decisionOf());

    expect(localStorage.getItem(discardTallyKey)).toBe(bytes);
  });

  it("interns both digest values and resolves the original stamp on read", () => {
    clearDiscardTally();
    recordDiscardDecision({ ...decisionOf(), tableIdentity: identity });
    recordDiscardDecision({
      ...decisionOf({ handKey: "second" }),
      tableIdentity: identity,
    });
    const stored = JSON.parse(
      localStorage.getItem(discardTallyKey) as string,
    ) as { tableIdentities: unknown[]; records: { tableIdentity: unknown }[] };

    expect(stored.tableIdentities).toStrictEqual([identity]);
    expect(
      stored.records.map(
        (row: { tableIdentity: unknown }) => row.tableIdentity,
      ),
    ).toStrictEqual(["0", "0"]);
    expect(
      readTallyForDisplay().records.map((row) => row.tableIdentity),
    ).toStrictEqual([identity, identity]);
  });

  it.each(["crib", "play"] as const)(
    "interns a %s-only change as a different pair",
    (table) => {
      clearDiscardTally();
      const changed = {
        ...identity,
        [table]: { means_sha256: "c".repeat(64) },
      };
      recordDiscardDecision({ ...decisionOf(), tableIdentity: identity });
      recordDiscardDecision({
        ...decisionOf({ handKey: "changed" }),
        tableIdentity: changed,
      });

      expect(
        readTallyForDisplay().records.map((row) => row.tableIdentity),
      ).toStrictEqual([identity, changed]);
      expect(readTallyForDisplay().tableIdentities).toStrictEqual([
        identity,
        changed,
      ]);
    },
  );

  it.each([
    0,
    "missing",
    { crib: identity.crib },
    { ...identity, play: { means_sha256: "bad" } },
  ])(
    "keeps a valid legacy loss with invalid identity %j as unknown",
    (tableIdentity) => {
      storeRaw(
        JSON.stringify(
          storedWith({
            records: [{ ...decisionOf(), tableIdentity }],
            version: 7,
          }),
        ),
      );
      const [row] = readTallyForDisplay().records;

      expect(row?.expectedPointsLoss).toBe(1.5);
      expect(row?.tableIdentity).toBeNull();
    },
  );
});

/* jscpd:ignore-end */
