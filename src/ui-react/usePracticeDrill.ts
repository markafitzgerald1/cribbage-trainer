/* jscpd:ignore-start */
import {
  type MistakeQueueItem,
  buildMistakeQueue,
  sampleMistakeQueueByPriority,
} from "../ui/mistakeQueue";
import { readTallyForDisplay, recordPracticeAttempt } from "../ui/discardTally";
import { useCallback, useRef, useState } from "react";
import type { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import type { RenderedAnalysis } from "./useDiscardTelemetry";
import { serializeHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

const SUCCESSES_FOR_MASTERY = 2;

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
  // Forwards to the caller's own analysis handler, then records the drill attempt once the answer is on screen.
  readonly handleAnalysisRendered: (analysis: RenderedAnalysis) => void;
  readonly handleStartAutoDrill: () => void;
  readonly handleStartDrill: (item: MistakeQueueItem) => void;
  readonly hasNextHand: boolean;
  readonly isActive: boolean;
  readonly onCommit: () => void;
  readonly onExit: () => void;
  readonly onNextHand: () => void;
  readonly phase: PracticeDrillPhase;
  readonly verdict: PracticeVerdict | null;
}

interface UsePracticeDrillArgs {
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
    () =>
      sampleMistakeQueueByPriority(
        buildMistakeQueue(readTallyForDisplay()),
        generateRandomNumber(),
      ),
    [generateRandomNumber],
  );

  const startAutoDrill = useCallback(() => {
    const next = drawNext();
    if (next !== null) {
      beginWith(next);
    }
  }, [beginWith, drawNext]);

  const onExit = useCallback(() => {
    recordedRef.current = false;
    setActiveItem(null);
    setPhase("choosing");
    setVerdict(null);
    setHasNextHand(false);
  }, []);

  const onCommit = useCallback(() => {
    setPhase("revealed");
  }, []);

  const onNextHand = useCallback(() => {
    const next = drawNext();
    if (next === null) {
      onExit();
      return;
    }
    beginWith(next);
  }, [beginWith, drawNext, onExit]);

  const handleAnalysisRendered = useCallback(
    (analysis: RenderedAnalysis) => {
      onAnalysisRendered(analysis);
      if (
        activeItem === null ||
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
      const consecutiveSuccesses = isOptimal
        ? activeItem.consecutiveSuccesses + 1
        : 0;
      setHasNextHand(activeHandsExist());
      setVerdict({
        chosenDiscard: serializeHand(dealtCards.filter((card) => !card.kept)),
        chosenLoss: expectedPointsLoss,
        consecutiveSuccesses,
        isMastered: consecutiveSuccesses >= SUCCESSES_FOR_MASTERY,
        isOptimal,
        previousDiscard: activeItem.previousDiscard,
        previousLoss: activeItem.lossIfWrong,
      });
    },
    [activeItem, dealtCards, onAnalysisRendered, phase],
  );

  return {
    activeItem,
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
