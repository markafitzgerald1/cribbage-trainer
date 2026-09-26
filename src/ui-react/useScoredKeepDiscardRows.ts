import {
  type DiscardHighlightTier,
  getRowTitle,
} from "./ScoredPossibleKeepDiscard";
import { type CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { type MistakeClassification } from "../analysis/classifyMistake";
import { type PlayUncertainty } from "../game/playUncertainty";
import type { ScoredKeepDiscard } from "../analysis/analysis";
import { type Uncertainty } from "../game/uncertaintySidecar";
import { cribUncertaintyBound } from "../analysis/cribUncertaintyBound";
import { isEqualBestCandidate } from "../analysis/optimalDiscard";
import { playDeltaStandardError } from "../analysis/playDeltaStandardError";
import { useMemo } from "react";

export interface ScoredKeepDiscardRow {
  /*
   * Null while a deferred sidecar is still in flight, and after one that
   * never arrived or was rejected. The means-only ranking is complete without
   * either figure, so nothing here waits on one.
   */
  readonly cribUncertainty: number | null;
  readonly descriptionId: string | null;
  readonly highlightTier: DiscardHighlightTier;
  readonly playUncertainty: number | null;
  readonly rowIndex: number;
  readonly rowTitle: string | undefined;
  readonly scoredKeepDiscard: ScoredKeepDiscard<DealtCard>;
}

export interface ScoredKeepDiscardRowsOptions {
  readonly chosenClassification: MistakeClassification | null;
  readonly cribRole: CribRole;
  readonly cribUncertainty: Uncertainty | null;
  readonly dealtCards: readonly DealtCard[];
  readonly isChosenWithinNoise: boolean;
  readonly playUncertainty: PlayUncertainty | null;
  readonly scoredKeepDiscards: readonly ScoredKeepDiscard<DealtCard>[];
  readonly scoredKeepDiscardsByNetScore: readonly ScoredKeepDiscard<DealtCard>[];
}

const getHighlightTier = (
  isChosen: boolean,
  isEqualBest: boolean,
): DiscardHighlightTier => {
  if (isChosen) {
    return "chosen";
  }
  if (isEqualBest) {
    return "equal-best";
  }
  return "none";
};

export const useScoredKeepDiscardRows = ({
  chosenClassification,
  cribRole,
  cribUncertainty,
  dealtCards,
  isChosenWithinNoise,
  playUncertainty,
  scoredKeepDiscards,
  scoredKeepDiscardsByNetScore,
}: ScoredKeepDiscardRowsOptions): readonly ScoredKeepDiscardRow[] =>
  useMemo(() => {
    const bestNet = scoredKeepDiscardsByNetScore[0]?.expectedNetPoints ?? 0;

    return scoredKeepDiscards.map((scoredKeepDiscard, index) => {
      const isChosen = scoredKeepDiscard.keep.every((card) => card.kept);
      const isEqualBest =
        !isChosen &&
        isEqualBestCandidate(bestNet, scoredKeepDiscard.expectedNetPoints);
      const highlightTier = getHighlightTier(isChosen, isEqualBest);
      const rowTitle = getRowTitle(
        highlightTier,
        isChosen ? chosenClassification : null,
        isChosen && isChosenWithinNoise,
      );
      const descriptionId = rowTitle
        ? `scored-discard-${index}-description`
        : null;

      return {
        cribUncertainty:
          cribUncertainty === null
            ? null
            : cribUncertaintyBound({
                cribStarterPoints: scoredKeepDiscard.cribStarterPoints,
                discard: scoredKeepDiscard.discard,
                knownCards: dealtCards,
                role: cribRole,
                uncertainty: cribUncertainty,
              }),
        descriptionId,
        highlightTier,
        playUncertainty:
          playUncertainty === null
            ? null
            : playDeltaStandardError({
                keep: scoredKeepDiscard.keep,
                role: cribRole,
                uncertainty: playUncertainty,
              }),
        rowIndex: index,
        rowTitle,
        scoredKeepDiscard,
      };
    });
  }, [
    chosenClassification,
    cribRole,
    cribUncertainty,
    dealtCards,
    isChosenWithinNoise,
    playUncertainty,
    scoredKeepDiscards,
    scoredKeepDiscardsByNetScore,
  ]);
