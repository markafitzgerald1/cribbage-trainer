/* jscpd:ignore-start */
import {
  DRILL_RELABELING_SHIPPED_AT,
  withoutStrayDrillRecords,
} from "./strayDrillRecords";
import {
  type SkippedHand,
  discardTallyKey,
  readTallyForDisplay,
  recordSkippedHand,
} from "./discardTally";
import { asJson, storeRaw, storedWith } from "./discardTally.test.common";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import type { DiscardDecisionRecord } from "./discardDecisionRecord";
import type { PracticeRecord } from "./practiceLedger";
/* jscpd:ignore-end */

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
/*
 * A relabeling of the drilled hand that swaps only diamonds and spades,
 * leaving hearts and clubs where it found them. `suitPermutationForView`
 * cannot produce it — every view moves every suit the hand uses — so however
 * much it looks like a stray, a drill did not write it.
 */
const FIXED_SUIT_KEY = "7H,AS,10D,AC,5C,5H|Pone";
// A third relabeling of the same six ranks, moving every suit of both keys above.
const THIRD_RELABELING_KEY = "7S,AH,10C,AD,5D,5S|Pone";

/*
 * Every fixture below is dated after the build that could first write a
 * stray, derived from the cutoff itself rather than restated, so a change to
 * the cutoff cannot leave these tests asserting against the wrong era.
 */
const DRILLED_AT = DRILL_RELABELING_SHIPPED_AT + 1_000;

const recordOf = (
  handKey: string,
  isPractice: boolean,
  {
    at = DRILLED_AT,
    withRecency = true,
  }: { at?: number; withRecency?: boolean } = {},
): DiscardDecisionRecord => {
  const record = {
    at,
    cribRole: CribRole.Pone,
    discardKey: "5H,6H",
    expectedPointsLoss: 1.5,
    handKey,
    isOptimal: false,
    isPractice,
  };
  // A record written before recencyAt existed simply omits it, which is what a legacy row looks like.
  return withRecency ? { ...record, recencyAt: at } : record;
};

/*
 * Dated later than the same-commit fixtures, which is the order the two
 * writes actually happen in: recordPracticeAttempt forces its lastAttemptAt
 * past the decision recency recordDiscardDecision just wrote for that commit.
 * The recency-guard case below deliberately breaks that ordering by dating a
 * record after it, which is the whole point of that case.
 */
const LAST_ATTEMPT_AT = DRILLED_AT + 10;

/*
 * A tally whose rows and ledger all predate the production cutoff, which is
 * the only thing standing between its relabeled practice row and the sweep.
 * Older than the cutoff is not the same as older than the code — previews
 * ran it first — so this says when the row was written, not what wrote it.
 */
const BEFORE_SHIPPED = DRILL_RELABELING_SHIPPED_AT - 100_000;

const DRILLED_LEDGER: readonly PracticeRecord[] = [
  {
    attempts: 1,
    consecutiveSuccesses: 0,
    handKey: DRILLED_KEY,
    lastAttemptAt: LAST_ATTEMPT_AT,
    totalWrongLoss: 1.5,
    wrong: 1,
  },
];

const AUTHENTIC = recordOf(DRILLED_KEY, false);

const ledgerEntryFor = (handKey: string): PracticeRecord => ({
  ...(DRILLED_LEDGER.at(0) as PracticeRecord),
  handKey,
});

const PRE_SHIP_LEDGER: readonly PracticeRecord[] = [
  {
    ...(DRILLED_LEDGER.at(0) as PracticeRecord),
    lastAttemptAt: BEFORE_SHIPPED + 50,
  },
];
const STRAY = recordOf(STRAY_KEY, true);
const SWEPT_PAIR: readonly DiscardDecisionRecord[] = [AUTHENTIC, STRAY];

const storedTally = (): unknown =>
  JSON.parse(localStorage.getItem(discardTallyKey) as string);

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
       * The row the over-broad fix reverted during #808's review took with
       * it. A drilled mistake's own key is the identity relabeling of
       * itself, so the exact-key check has to spare it before the signature
       * check ever sees it.
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
      expected: [FIXED_SUIT_KEY],
      name: "keeps a relabeling that leaves one of the hand's suits in place",
      practice: DRILLED_LEDGER,
      records: [recordOf(FIXED_SUIT_KEY, true)],
    },
    {
      /*
       * Written after the hand's last drill, so no drill of it can have
       * written this row: the practice attempt for a commit always lands
       * after the decision record that commit wrote.
       */
      expected: [STRAY_KEY],
      name: "keeps a practice row recorded after the hand's last drill",
      practice: DRILLED_LEDGER,
      records: [recordOf(STRAY_KEY, true, { at: LAST_ATTEMPT_AT + 1 })],
    },
    {
      expected: [],
      name: "drops a stray written before recencyAt was recorded at all",
      practice: DRILLED_LEDGER,
      records: [recordOf(STRAY_KEY, true, { withRecency: false })],
    },
    {
      /*
       * Dated before the production cutoff, so the sweep spares it. That is
       * all this proves: the fixture at the top of this file came from a
       * live #808 preview, which ran the offending code before the merge, so
       * a row this old can perfectly well be a real stray. The test is about
       * the filter being conservative, not about the row's origin.
       */
      expected: [STRAY_KEY],
      name: "keeps a relabeled row dated before the production cutoff",
      practice: DRILLED_LEDGER,
      records: [
        recordOf(STRAY_KEY, true, { at: DRILL_RELABELING_SHIPPED_AT - 1 }),
      ],
    },
    {
      expected: [],
      name: "drops a stray when several drilled hands share one signature",
      practice: [...DRILLED_LEDGER, ledgerEntryFor(STRAY_KEY)],
      records: [recordOf(THIRD_RELABELING_KEY, true)],
    },
    {
      expected: [DRILLED_KEY],
      name: "ignores a ledger entry whose hand key cannot be parsed",
      practice: [ledgerEntryFor("not a hand key"), ...DRILLED_LEDGER],
      records: SWEPT_PAIR,
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
) => ({
  ...storedWith({}),
  practice,
  records,
  revision: 3,
  skipped: [] as readonly SkippedHand[],
  version: 5,
});

describe("sweeping a tally already in storage", () => {
  it("drops the stray rows the first time it is read", () => {
    storeRaw(asJson(storedTallyOf(SWEPT_PAIR, DRILLED_LEDGER)));

    expect(
      readTallyForDisplay().records.map((one) => one.handKey),
    ).toStrictEqual([DRILLED_KEY]);
  });

  /*
   * #809's acceptance criterion as far as it can be met, and the
   * load-bearing part is that the
   * practice row here is a relabeling of the drilled hand which satisfies
   * every other condition of a stray — same ranks in deal order, same role,
   * every used suit moved, recorded before the hand's last drill. Only the
   * #808 cutoff keeps it, so this fails if that cutoff is removed. Dating
   * the whole tally after the cutoff, as an earlier version of this test
   * did, made it pass against a build with no cutoff at all and proved
   * nothing about the criterion it names.
   *
   * A write is forced rather than avoided, because the read path alone
   * writes nothing: asserting that storage is unchanged across a bare read
   * would hold against any implementation at all. What has to survive is a
   * round trip through a real write, and everything the tally carries is
   * compared, not just the records — the three things a skip is supposed to
   * move are stated as what they become rather than skipped over.
   */
  it("leaves everything in a tally dated before the cutoff", () => {
    const untouched = [
      recordOf(DRILLED_KEY, false, { at: BEFORE_SHIPPED }),
      recordOf(STRAY_KEY, true, { at: BEFORE_SHIPPED + 1 }),
    ];
    const before = storedTallyOf(untouched, PRE_SHIP_LEDGER);
    storeRaw(asJson(before));

    recordSkippedHand(BEFORE_SHIPPED + 100);

    expect(storedTally()).toStrictEqual({
      ...before,
      lifetime: { ...before.lifetime, skippedHands: 1 },
      revision: before.revision + 1,
      skipped: [{ at: BEFORE_SHIPPED + 100 }],
    });
  });
});
