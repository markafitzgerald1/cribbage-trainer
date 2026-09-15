import {
  AT,
  asJson,
  storeRaw,
  storedRecords,
  storedWith,
} from "./discardTally.test.common";
import { describe, expect, it } from "@jest/globals";
import { readTallyForDisplay, recordSkippedHand } from "./discardTally";
import { CribRole } from "../game/expectedCribPoints";
import type { DiscardDecisionRecord } from "./discardDecisionRecord";
import type { PracticeRecord } from "./practiceLedger";
import { withoutStrayDrillRecords } from "./strayDrillRecords";

/*
 * The exact pair #809 captured from a live #808 preview: one committed drill
 * attempt against a seeded single-mistake tally left the ledger holding the
 * hand the player actually misplayed and the records holding a row under a
 * four-cycle relabeling of it (H→D, D→C, S→H, C→S).
 */
const DRILLED_KEY = "7H,AD,10S,AC,5C,5H|Pone";
const STRAY_KEY = "7D,AC,10H,AS,5S,5D|Pone";
// The same six cards as the stray, under the other role — which no drill of DRILLED_KEY can produce.
const OTHER_ROLE_KEY = "7D,AC,10H,AS,5S,5D|Dealer";
// Typed into "Enter cards" rather than dealt: recorded as practice, and no drill ever touched it.
const MANUAL_KEY = "2C,3D,4S,6H,8C,9D|Dealer";

const recordOf = (
  handKey: string,
  isPractice: boolean,
  at = AT,
): DiscardDecisionRecord => ({
  at,
  cribRole: CribRole.Pone,
  discardKey: "5H,6H",
  expectedPointsLoss: 1.5,
  handKey,
  isOptimal: false,
  isPractice,
  recencyAt: at,
});

const DRILLED_LEDGER: readonly PracticeRecord[] = [
  {
    attempts: 1,
    consecutiveSuccesses: 0,
    handKey: DRILLED_KEY,
    lastAttemptAt: AT,
    totalWrongLoss: 1.5,
    wrong: 1,
  },
];

const AUTHENTIC = recordOf(DRILLED_KEY, false);
const STRAY = recordOf(STRAY_KEY, true);
const SWEPT_PAIR: readonly DiscardDecisionRecord[] = [AUTHENTIC, STRAY];

const keysAfterSweep = (
  records: readonly DiscardDecisionRecord[],
  practice: readonly PracticeRecord[],
) => withoutStrayDrillRecords(records, practice).map((one) => one.handKey);

describe("stray drill record sweep", () => {
  it.each([
    {
      expected: [DRILLED_KEY],
      name: "drops a practice row relabeling a drilled mistake",
      practice: DRILLED_LEDGER,
      records: SWEPT_PAIR,
    },
    {
      /*
       * The row the over-broad fix reverted during #808 took with it. A drilled mistake's own
       * key is the identity relabeling of itself, so the exact-key check has
       * to spare it before the signature check ever sees it.
       */
      expected: [DRILLED_KEY],
      name: "keeps a practice row carrying the drilled hand's own key",
      practice: DRILLED_LEDGER,
      records: [recordOf(DRILLED_KEY, true)],
    },
    {
      expected: [MANUAL_KEY],
      name: "keeps a manually entered practice row no drill relabeled",
      practice: DRILLED_LEDGER,
      records: [recordOf(MANUAL_KEY, true)],
    },
    {
      expected: [STRAY_KEY],
      name: "keeps an authentic row that happens to relabel a drilled hand",
      practice: DRILLED_LEDGER,
      records: [recordOf(STRAY_KEY, false)],
    },
    {
      expected: [OTHER_ROLE_KEY],
      name: "keeps a relabeling recorded under the other crib role",
      practice: DRILLED_LEDGER,
      records: [recordOf(OTHER_ROLE_KEY, true)],
    },
    {
      expected: [STRAY_KEY],
      name: "keeps every row when nothing has been drilled",
      practice: [],
      records: [STRAY],
    },
    {
      /*
       * Only a decision record can hold a key this build cannot parse — a
       * ledger entry with one is rejected on the way in — so such a key
       * cannot be a relabeling of anything that was drilled.
       */
      expected: ["not a hand key"],
      name: "keeps a practice row whose hand key cannot be parsed",
      practice: DRILLED_LEDGER,
      records: [recordOf("not a hand key", true)],
    },
  ])("$name", ({ expected, practice, records }) => {
    expect(keysAfterSweep(records, practice)).toStrictEqual(expected);
  });

  it("leaves nothing for a second pass to remove", () => {
    const swept = withoutStrayDrillRecords(SWEPT_PAIR, DRILLED_LEDGER);

    expect(withoutStrayDrillRecords(swept, DRILLED_LEDGER)).toStrictEqual(
      swept,
    );
  });
});

// Built on the shared stored-tally shape rather than a second literal of it, since the lifetime figures are beside the point here.
const storedTallyOf = (
  records: readonly DiscardDecisionRecord[],
  practice: readonly PracticeRecord[],
) => storedWith({ practice, records, revision: 3, skipped: [], version: 5 });

describe("stray drill rows already in storage", () => {
  it("are gone the first time the tally is read", () => {
    storeRaw(asJson(storedTallyOf(SWEPT_PAIR, DRILLED_LEDGER)));

    expect(
      readTallyForDisplay().records.map((one) => one.handKey),
    ).toStrictEqual([DRILLED_KEY]);
  });

  /*
   * A tally written before suit-permuted drills existed has no stray to find,
   * so reading it and writing it back must return the same rows it held —
   * including the manually entered practice row, which shares nothing with
   * the drilled hand but its `isPractice` flag.
   */
  it("leave a tally that predates them byte-identical", () => {
    const untouched = [AUTHENTIC, recordOf(MANUAL_KEY, true, AT + 1)];
    storeRaw(asJson(storedTallyOf(untouched, DRILLED_LEDGER)));

    recordSkippedHand(AT + 2);

    expect(storedRecords()).toStrictEqual(untouched);
  });
});
