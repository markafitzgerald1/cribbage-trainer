/* jscpd:ignore-start */
import {
  AT,
  DAYS_EARLIER,
  asJson,
  decisionOf,
  storeRaw,
  storedWith,
} from "./discardTally.test.common";
import {
  clearDiscardTally,
  readDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
} from "./discardTally";
import { describe, expect, it } from "@jest/globals";
/* jscpd:ignore-end */

const recordFutureSkewedDecision = (handKey: string, at = AT + 5000) => {
  clearDiscardTally();
  recordDiscardDecision(decisionOf({ at, handKey }));
};

const recordCorrectedDecision = (handKey: string) =>
  recordDiscardDecision(decisionOf({ at: AT, handKey }));

const getRecordedAt = (index: number) =>
  readTallyForDisplay().records[index]?.at;

const getRecordedRecencyAt = (index: number) =>
  readTallyForDisplay().records[index]?.recencyAt;

describe("discard tally clock ordering", () => {
  it("orders an authentic decision after a corrected device clock", () => {
    const futureAt = AT + DAYS_EARLIER;
    recordFutureSkewedDecision("first", futureAt);
    recordCorrectedDecision("second");

    expect([getRecordedAt(0), getRecordedAt(1)]).toStrictEqual([futureAt, AT]);
    expect(getRecordedRecencyAt(1)).toBe(futureAt + 1);
    expect(readDiscardTally(AT).todayDecisions).toBe(1);
  });

  it("migrates legacy records in their recorded order", () => {
    const futureAt = AT + DAYS_EARLIER;
    storeRaw(
      asJson(
        storedWith({
          records: [
            decisionOf({ at: futureAt, handKey: "first" }),
            decisionOf({ at: AT, handKey: "second" }),
          ],
          version: 4,
        }),
      ),
    );

    expect(
      readTallyForDisplay().records.map((record) => record.recencyAt),
    ).toStrictEqual([futureAt, futureAt + 1]);
  });

  it("orders an authentic decision after a future-skewed practice attempt", () => {
    const practiceHandKey = "5H,6H,7H,8H,9H,10H|Dealer";
    recordFutureSkewedDecision(practiceHandKey);
    recordPracticeAttempt({
      at: AT,
      handKey: practiceHandKey,
      isOptimal: true,
    });
    recordCorrectedDecision("second");

    expect(getRecordedAt(1)).toBe(AT);
    expect(getRecordedRecencyAt(1)).toBe(AT + 5002);
  });

  it("orders a practice attempt after a future-skewed authentic decision", () => {
    const handKey = "5H,6H,7H,8H,9H,10H|Dealer";
    recordFutureSkewedDecision(handKey);
    recordCorrectedDecision("second");
    recordCorrectedDecision("third");
    recordPracticeAttempt({ at: AT, handKey, isOptimal: true });

    expect(readTallyForDisplay().practice).toMatchObject([
      { lastAttemptAt: AT + 5003 },
    ]);
  });
});
