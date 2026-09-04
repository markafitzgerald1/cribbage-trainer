/* jscpd:ignore-start */
import {
  type MistakeQueueItem,
  SUCCESSES_FOR_MASTERY,
  buildMistakeQueue,
  sampleMistakeQueueByPriority,
} from "../ui/mistakeQueue";
import { readTallyForDisplay, recordPracticeAttempt } from "../ui/discardTally";
import { useCallback, useRef, useState } from "react";
import type { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import type { RenderedAnalysis } from "./useDiscardTelemetry";
import { discardIsComplete } from "../game/discardIsComplete";
import { serializeHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

// Draw one specific mistake, or let the sampler pick; both optional, exposed by the tally view and its queue dialog.
export type StartDrillHandler = ((item: MistakeQueueItem) => void) | null;
export type StartAutoDrillHandler = (() => void) | null;

export interface PracticeDrillHand {
  readonly cribRole: CribRole;
  readonly dealtCards: DealtCard[];
}

/*
 * The result of one committed drill choice, phrased as what changed rather
 * than a bare right or wrong: the discard chosen last time and its cost, the
 * discard chosen now and its cost, and where the mastery streak now stands.
 * A player who watches their own reasoning move is the one who stops
 * re-deriving the recommendation.
 */
export interface PracticeVerdict {
  readonly chosenDiscard: string;
  readonly chosenLoss: number;
  readonly consecutiveSuccesses: number;
  readonly isMastered: boolean;
  readonly isOptimal: boolean;
  readonly previousDiscard: string | null;
  readonly previousLoss: number;
}

export type PracticeDrillPhase = "choosing" | "revealed";

export interface PracticeDrill {
  readonly activeItem: MistakeQueueItem | null;
  // Drops the retained drill state without touching the board — for a history restore, which brings its own hand back.
  readonly clearDrill: () => void;
  // Forwards to the caller's own analysis handler, then records the drill attempt once the answer is on screen.
  readonly handleAnalysisRendered: (analysis: RenderedAnalysis) => void;
  readonly handleStartAutoDrill: () => void;
  readonly handleStartDrill: (item: MistakeQueueItem) => void;
  readonly hasNextHand: boolean;
  readonly isActive: boolean;
  readonly onCommit: () => void;
  // The "Exit drill" action: leaves practice and deals a fresh authentic hand.
  readonly onExit: () => void;
  readonly onNextHand: () => void;
  readonly phase: PracticeDrillPhase;
  readonly verdict: PracticeVerdict | null;
}

interface UsePracticeDrillArgs {
  // The crib role on the board, so the drill can tell its own hand from the same six cards resubmitted under the opposite role.
  readonly cribRole: CribRole;
  // Deals a fresh authentic hand — how "Exit drill" and an exhausted queue return the player to normal play.
  readonly dealFreshHand: () => void;
  readonly dealtCards: readonly DealtCard[];
  readonly generateRandomNumber: () => number;
  // The manual hand-load path, so the loaded hand is flagged practice and never enters the headline averages.
  readonly loadHand: (hand: PracticeDrillHand) => void;
  readonly onAnalysisRendered: (analysis: RenderedAnalysis) => void;
}

/*
 * The one place a drill hand is turned into cards on the board. A later
 * suit-permuted variant (#767) permutes `item.cards` here and nowhere else.
 */
const toDrillHand = (item: MistakeQueueItem): PracticeDrillHand => ({
  cribRole: item.cribRole,
  dealtCards: toDealtCards(item.cards, []),
});

const activeHandsExist = (): boolean =>
  buildMistakeQueue(readTallyForDisplay()).some((item) => !item.isMastered);

export const usePracticeDrill = ({
  cribRole,
  dealFreshHand,
  dealtCards,
  generateRandomNumber,
  loadHand,
  onAnalysisRendered,
}: UsePracticeDrillArgs): PracticeDrill => {
  const [activeItem, setActiveItem] = useState<MistakeQueueItem | null>(null);
  const [phase, setPhase] = useState<PracticeDrillPhase>("choosing");
  const [verdict, setVerdict] = useState<PracticeVerdict | null>(null);
  const [hasNextHand, setHasNextHand] = useState(false);
  // Guards a single record per committed choice; onAnalysisRendered re-fires on every re-sort.
  const recordedRef = useRef(false);

  /*
   * A drill owns the board only while its own six cards and crib role are on
   * it. Deal, a history move, or an Enter-cards submission (which can even
   * resubmit the same cards under the opposite role) replaces the board
   * without an explicit exit; reporting the drill inactive then keeps its
   * panel from lingering over an unrelated hand and its recorder from
   * scoring one. `serializeHand` ignores the kept flags, so choosing the
   * discards does not trip it.
   *
   * The one hole that leaves: the drill's own six cards carry a zero-discard
   * history entry, so Back onto it after a commit still matches (same cards,
   * same role) while resetting the selection. Rather than leave a revealed
   * panel showing a stale verdict over frozen, now-empty cards, the drill is
   * also over once its checked discard is gone — the hand stays on the board
   * and the analysis is simply shown, the same degradation a reload gives.
   */
  const drillLive =
    activeItem !== null &&
    cribRole === activeItem.cribRole &&
    serializeHand(dealtCards) === serializeHand(activeItem.cards) &&
    !(phase === "revealed" && !discardIsComplete(dealtCards));

  /*
   * When the drill stops holding the board it is finished, not merely
   * hidden: clearing the retained phase and verdict here — React's
   * sanctioned "adjust state while rendering" path, which it retries
   * without committing the discarded output — is what stops selecting two
   * cards on a Back-restored hand from resurrecting the old drill with its
   * stale verdict. `beginWith` resets `recordedRef` before the next drill,
   * so it needs no reset here.
   */
  if (activeItem !== null && !drillLive) {
    setActiveItem(null);
    setPhase("choosing");
    setVerdict(null);
    setHasNextHand(false);
  }

  const beginWith = useCallback(
    (item: MistakeQueueItem) => {
      recordedRef.current = false;
      setActiveItem(item);
      setPhase("choosing");
      setVerdict(null);
      setHasNextHand(activeHandsExist());
      loadHand(toDrillHand(item));
    },
    [loadHand],
  );

  const drawNext = useCallback(
    (excludeHandKey: string | null) =>
      sampleMistakeQueueByPriority(
        buildMistakeQueue(readTallyForDisplay()),
        generateRandomNumber(),
        excludeHandKey,
      ),
    [generateRandomNumber],
  );

  const startAutoDrill = useCallback(() => {
    const next = drawNext(null);
    if (next !== null) {
      beginWith(next);
    }
  }, [beginWith, drawNext]);

  const clearDrill = useCallback(() => {
    recordedRef.current = false;
    setActiveItem(null);
    setPhase("choosing");
    setVerdict(null);
    setHasNextHand(false);
  }, []);

  // "Exit drill": drop practice and deal a fresh authentic hand rather than leaving the drilled study hand on the board.
  const onExit = useCallback(() => {
    clearDrill();
    dealFreshHand();
  }, [clearDrill, dealFreshHand]);

  const onCommit = useCallback(() => {
    setPhase("revealed");
  }, []);

  const onNextHand = useCallback(() => {
    if (activeItem === null) {
      return;
    }
    // Exclude the hand just drilled so "Draw another" interleaves rather than repeating it back to back.
    const next = drawNext(activeItem.handKey);
    if (next === null) {
      onExit();
      return;
    }
    beginWith(next);
  }, [activeItem, beginWith, drawNext, onExit]);

  const handleAnalysisRendered = useCallback(
    (analysis: RenderedAnalysis) => {
      onAnalysisRendered(analysis);
      if (
        activeItem === null ||
        analysis.cribRole !== activeItem.cribRole ||
        phase !== "revealed" ||
        recordedRef.current ||
        analysis.quality === null
      ) {
        return;
      }
      recordedRef.current = true;
      const { expectedPointsLoss, isOptimal } = analysis.quality;
      recordPracticeAttempt(
        isOptimal
          ? { at: Date.now(), handKey: activeItem.handKey, isOptimal: true }
          : {
              at: Date.now(),
              expectedPointsLoss,
              handKey: activeItem.handKey,
              isOptimal: false,
            },
      );
      /*
       * Read the streak back from the record just written, not from the
       * activeItem snapshot taken when the drill started: recordPracticeAttempt
       * merges against whatever another tab has stored since, so the snapshot's
       * consecutiveSuccesses can be stale (an external miss can have reset it,
       * which would otherwise let this tab display two successes and declare
       * mastery over a stored streak of one).
       *
       * The record is absent only when recordPracticeAttempt refused the write
       * to protect a newer-build tally another tab left in localStorage; the
       * local estimate is the honest fallback there, matching the read-only
       * state the rest of the tally is already in.
       */
      const localStreakEstimate = isOptimal
        ? activeItem.consecutiveSuccesses + 1
        : 0;
      const stored = readTallyForDisplay().practice.find(
        (record) => record.handKey === activeItem.handKey,
      );
      const consecutiveSuccesses =
        stored?.consecutiveSuccesses ?? localStreakEstimate;
      setHasNextHand(activeHandsExist());
      setVerdict({
        chosenDiscard: serializeHand(dealtCards.filter((card) => !card.kept)),
        chosenLoss: expectedPointsLoss,
        consecutiveSuccesses,
        isMastered: consecutiveSuccesses >= SUCCESSES_FOR_MASTERY,
        isOptimal,
        previousDiscard: activeItem.previousDiscard,
        previousLoss: activeItem.previousDiscardLoss,
      });
    },
    [activeItem, dealtCards, onAnalysisRendered, phase],
  );

  /*
   * The render-time reset above guarantees `activeItem` is null in every
   * committed render where the drill no longer holds the board, so the raw
   * state is already the masked state — no `drillLive` gate is needed here.
   */
  return {
    activeItem,
    clearDrill,
    handleAnalysisRendered,
    handleStartAutoDrill: startAutoDrill,
    handleStartDrill: beginWith,
    hasNextHand,
    isActive: activeItem !== null,
    onCommit,
    onExit,
    onNextHand,
    phase,
    verdict,
  };
};
