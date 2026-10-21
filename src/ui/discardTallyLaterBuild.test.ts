import {
  AT,
  noiseJudgedSuccess,
  storeRaw,
  validRecord,
} from "./discardTally.test.common";
import { describe, expect, it } from "@jest/globals";
import {
  discardTallyKey,
  recordPracticeAttempt,
  recordSkippedHand,
} from "./discardTally";

interface WrittenTally {
  readonly attemptLog: unknown;
  readonly futureMeta: unknown;
  readonly lifetime: unknown;
  readonly records: unknown;
}

const HAND_KEY = "AH,2H,3H,4H,5H,6H|Dealer";
const sha = (digit: string) => digit.repeat(64);
const readable = {
  crib: { means_sha256: sha("a") },
  play: { means_sha256: sha("b") },
};
// A later build's identity this build cannot read, such as a renamed digest field.
const futureIdentity = {
  crib: { means_sha512: sha("c") },
  play: { means_sha512: sha("d") },
};

const attemptFields = [
  HAND_KEY,
  "AH,2H",
  AT,
  1,
  "1",
  1.5,
  false,
  "failure",
  "exact-v1",
] as const;

const lifetime = {
  decisions: 1,
  expectedPointsLossTotal: 1.5,
  optimalDecisions: 0,
  skippedHands: 0,
};

const storedTallyWith = (overrides: Record<string, unknown>) => ({
  lifetime,
  practice: [],
  records: [],
  revision: 4,
  skipped: [],
  tableIdentities: [readable, futureIdentity],
  version: 8,
  ...overrides,
});

// Any write that does not touch the data under test, which is how a later build's fields get lost.
const writeUnrelatedAndReadStored = (stored: unknown) => {
  storeRaw(JSON.stringify(stored));
  recordSkippedHand(AT);
  return JSON.parse(
    localStorage.getItem(discardTallyKey) as string,
  ) as WrittenTally;
};

describe("a later build's stored fields through this build's write", () => {
  it("keeps a decision's reference to an identity it cannot read", () => {
    const written = writeUnrelatedAndReadStored(
      storedTallyWith({ records: [{ ...validRecord, tableIdentity: "1" }] }),
    );

    expect(written.records).toMatchObject([{ tableIdentity: "1" }]);
  });

  it("keeps a logged attempt's reference to an identity it cannot read", () => {
    const written = writeUnrelatedAndReadStored(
      storedTallyWith({ attemptLog: [attemptFields] }),
    );

    expect(written.attemptLog).toStrictEqual([attemptFields]);
  });

  it("keeps an object-form attempt's additive fields", () => {
    const [handKey, discardKey, at, order, tableIdentity] = attemptFields;
    const attempt = {
      at,
      basis: "exact-v1",
      discardKey,
      expectedPointsLoss: 1.5,
      futureField: { note: "kept" },
      handKey,
      isOptimal: false,
      order,
      outcome: "failure",
      tableIdentity,
    };

    const written = writeUnrelatedAndReadStored(
      storedTallyWith({ attemptLog: [attempt] }),
    );

    expect(written.attemptLog).toStrictEqual([attempt]);
  });

  it("keeps an additive lifetime counter and top-level metadata", () => {
    const written = writeUnrelatedAndReadStored(
      storedTallyWith({
        futureMeta: { by: "later" },
        lifetime: { ...lifetime, futureCounter: 7 },
      }),
    );

    expect([written.futureMeta, written.lifetime]).toMatchObject([
      { by: "later" },
      { futureCounter: 7 },
    ]);
  });

  it("keeps a practice aggregate's additive field when that hand is rebuilt", () => {
    storeRaw(
      JSON.stringify(
        storedTallyWith({
          practice: [
            {
              attempts: 1,
              consecutiveSuccesses: 0,
              futureField: "kept",
              handKey: HAND_KEY,
              lastAttemptAt: AT,
              totalWrongLoss: 1.5,
              wrong: 1,
            },
          ],
        }),
      ),
    );

    recordPracticeAttempt(noiseJudgedSuccess(0.1));

    expect(
      (
        JSON.parse(localStorage.getItem(discardTallyKey) as string) as {
          practice: unknown[];
        }
      ).practice,
    ).toMatchObject([{ attempts: 2, futureField: "kept" }]);
  });
});
