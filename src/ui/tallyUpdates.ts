import {
  type DiscardDecisionRecord,
  latestDecisionRecencyAt,
} from "./discardDecisionRecord";
import { type PracticeAttempt, updatePracticeRecords } from "./practiceLedger";
import { MAX_ATTEMPT_LOG } from "./practiceAttemptLog";
import type { StoredTally } from "./discardTally";
import { normalizeAdmission } from "./recordedAdmission";
import {
  normalizeTableIdentity,
  sameTableIdentity,
} from "../game/tableIdentity";

const addToLifetime = (
  lifetime: StoredTally["lifetime"],
  decision: DiscardDecisionRecord,
): StoredTally["lifetime"] =>
  decision.isPractice
    ? lifetime
    : {
        ...lifetime,
        decisions: lifetime.decisions + 1,
        expectedPointsLossTotal:
          lifetime.expectedPointsLossTotal + decision.expectedPointsLoss,
        optimalDecisions:
          lifetime.optimalDecisions + (decision.isOptimal ? 1 : 0),
      };

/*
 * Which stored record, if any, this decision is a repeat of. Idempotency is
 * by hand rather than by call: collapsing repeats here rather than in the
 * caller is what makes a reload safe, since a completed discard restored
 * from its own URL renders exactly as a fresh one does and no amount of care
 * in a component can tell the two apart.
 *
 * Directional on purpose, and both directions are load-bearing. A practice
 * record must not absorb an authentic decision: practice covers manually
 * entered, seeded, deep-linked and history-restored hands as well as retained
 * drill rows, and any of them owning a hand's key would drop a later
 * authentic deal of those six cards in that order and role — silently, since
 * the loss is a decision that was never counted and no figure afterwards
 * looks wrong (#830). An authentic record must still absorb a practice
 * decision, because that is how a drill's attempt folds into the record of
 * the hand it stands in for instead of appending a row naming cards the
 * player never met (#809).
 */
const repeatOf = (
  records: readonly DiscardDecisionRecord[],
  decision: DiscardDecisionRecord,
): DiscardDecisionRecord | undefined =>
  records.find(
    (record) =>
      record.handKey === decision.handKey &&
      (!record.isPractice || decision.isPractice),
  );

const matchesIdentity = (
  one: DiscardDecisionRecord,
  other: DiscardDecisionRecord,
): boolean => {
  const a = normalizeTableIdentity(one.tableIdentity);
  const b = normalizeTableIdentity(other.tableIdentity);
  return a === null || b === null ? a === b : sameTableIdentity(a, b);
};

export const sameDecisionJudgment = (
  one: DiscardDecisionRecord,
  other: DiscardDecisionRecord,
): boolean =>
  one.discardKey === other.discardKey &&
  one.isPractice === other.isPractice &&
  one.expectedPointsLoss === other.expectedPointsLoss &&
  one.isOptimal === other.isOptimal &&
  matchesIdentity(one, other);

export const extendDecisionTally = (
  tally: StoredTally,
  decision: DiscardDecisionRecord,
  maxRecords: number,
): StoredTally => {
  const existing = repeatOf(tally.records, decision);
  const admission = normalizeAdmission(decision.recordedAdmission);
  if (existing) {
    if (
      existing.recordedAdmission !== "pending" ||
      admission === null ||
      admission === "pending" ||
      existing.at !== decision.at ||
      !sameDecisionJudgment(existing, decision)
    ) {
      return tally;
    }
    return {
      ...tally,
      records: tally.records.map((record) =>
        record === existing
          ? { ...record, recordedAdmission: admission }
          : record,
      ),
    };
  }
  const recencyAt = tally.practice.reduce(
    (latestAt, record) => Math.max(latestAt, record.lastAttemptAt + 1),
    latestDecisionRecencyAt(tally.records, decision.at - 1) + 1,
  );
  const recordedDecision = {
    ...decision,
    recencyAt,
    tableIdentity: normalizeTableIdentity(decision.tableIdentity),
  };
  return {
    ...tally,
    lifetime: addToLifetime(tally.lifetime, recordedDecision),
    records: [...tally.records, recordedDecision].slice(-maxRecords),
  };
};

export const extendPracticeTally = (
  tally: StoredTally,
  attempt: PracticeAttempt,
  maxRecords: number,
): StoredTally => {
  const latestDecisionAt = latestDecisionRecencyAt(
    tally.records,
    attempt.at - 1,
  );
  const practice = updatePracticeRecords(tally.practice, attempt, {
    latestDecisionAt,
    maxRecords,
  });
  if (practice === tally.practice) {
    return tally;
  }
  const detail = attempt.detail;
  return {
    ...tally,
    practice,
    ...(detail
      ? {
          attemptLog: [
            ...(tally.attemptLog ?? []),
            {
              ...detail,
              at: attempt.at,
              handKey: attempt.handKey,
              order: (tally.attemptLog?.at(-1)?.order ?? 0) + 1,
              tableIdentity: normalizeTableIdentity(detail.tableIdentity),
            },
          ].slice(-MAX_ATTEMPT_LOG),
        }
      : {}),
  };
};
