import {
  type DiscardQuality,
  getDiscardQuality,
} from "../analysis/discardQuality";
import {
  type MistakeClassification,
  classifyScoredMistake,
  formatAccessibleNetLoss,
} from "../analysis/classifyMistake";
import {
  type OptimalDiscardMargin,
  computeOptimalDiscardMargin,
} from "../analysis/optimalDiscard";
import {
  type RoleLossPairLabel,
  oppositeRoleExpectedPointsLoss,
  roleLossPairLabel,
} from "../analysis/oppositeRoleLoss";
import {
  type SidecarUncertainties,
  useSidecarUncertainties,
} from "./useUncertainty";
import {
  discardLoss,
  discardNoiseThreshold,
  isWithinNoise,
} from "../analysis/discardNoiseThreshold";
import { type CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { type ExpectedTables } from "./expectedTables";
import type { ScoredKeepDiscard } from "../analysis/analysis";
import { type UncertaintySource } from "../game/uncertaintyLoader";
import { useMemo } from "react";

export interface ChosenDiagnosticInfo {
  readonly captionAriaLabel: string | null;
  readonly chosenClassification: MistakeClassification | null;
  readonly optimalMargin: OptimalDiscardMargin;
  // Null until a discard is complete and the tables have loaded; never zero to stand in for unknown.
  readonly oppositeRoleLoss: number | null;
  readonly rolePair: RoleLossPairLabel;
  /*
   * The noise threshold when the chosen discard's positive loss falls within
   * it (#774), so the caption can say so instead of "Sub-optimal"; null
   * otherwise, including while the sidecars are still loading.
   */
  readonly withinNoiseThreshold: number | null;
}

interface ChosenDiagnosticInput {
  readonly cribRole: CribRole;
  readonly cribUncertaintySource: UncertaintySource;
  readonly playUncertaintySource: UncertaintySource;
  readonly dealtCards: readonly DealtCard[];
  readonly scoredOptions: readonly ScoredKeepDiscard<DealtCard>[];
  readonly tables: ExpectedTables | null;
}

export interface ChosenDiagnostics extends ChosenDiagnosticInfo {
  readonly quality: DiscardQuality | null;
  readonly sidecars: SidecarUncertainties;
}

export const useChosenDiagnosticInfo = ({
  cribRole,
  cribUncertaintySource,
  dealtCards,
  playUncertaintySource,
  scoredOptions,
  tables,
}: ChosenDiagnosticInput): ChosenDiagnostics => {
  const quality = useMemo(
    () => getDiscardQuality(scoredOptions),
    [scoredOptions],
  );
  const sidecars = useSidecarUncertainties({
    areResultsOnScreen: tables !== null,
    cribSource: cribUncertaintySource,
    playSource: playUncertaintySource,
    shouldTrackSettled: quality !== null && !quality.isOptimal,
  });
  const info = useMemo(() => {
    const chosen =
      scoredOptions.find((option) =>
        option.discard.every((card) => !card.kept),
      ) ?? null;
    const [best] = scoredOptions;
    const chosenClassification =
      best && chosen ? classifyScoredMistake(best, chosen) : null;
    /*
     * The discarded cards come from `dealtCards` rather than from the
     * matched option, so no second narrowing against null is needed: the
     * two cards not kept are the discard, by definition. Computed for
     * every completed decision rather than only for mistakes, because the
     * figure is evidence either way — a discard that was best for the role
     * held and costly for the other one says as much as the reverse.
     */
    const oppositeRoleLoss =
      tables === null || chosen === null
        ? null
        : oppositeRoleExpectedPointsLoss({
            cards: dealtCards,
            chosenDiscardCards: dealtCards.filter((card) => !card.kept),
            cribRole,
            tables,
          });
    const optimalMargin = computeOptimalDiscardMargin(scoredOptions);
    /*
     * The role costs live in the badge that already carried one of them
     * rather than in a chip of their own: a third chip on this row starts a
     * third row on a portrait phone at a large device font, which the #802
     * caption-height guard in practiceDrill.spec.ts fails. The measurements
     * are in skills/ui-layout-and-interaction/SKILL.md.
     */
    const rolePair = roleLossPairLabel(
      cribRole,
      chosenClassification?.netLoss ?? 0,
      oppositeRoleLoss,
    );
    const threshold =
      best && chosen && sidecars.crib !== null && sidecars.play !== null
        ? discardNoiseThreshold({
            best,
            chosen,
            cribUncertainty: sidecars.crib,
            knownCards: dealtCards,
            playUncertainty: sidecars.play,
            role: cribRole,
          })
        : null;
    const withinNoiseThreshold =
      best && chosen && isWithinNoise(discardLoss({ best, chosen }), threshold)
        ? threshold
        : null;
    /*
     * An optimal verdict cannot change, so it is announced at once. A positive
     * loss can still turn out to be within the noise, so its verdict waits for
     * both sidecars to load or fail; announcing "Sub-optimal" and then taking
     * it back is exactly what #825's live region would read aloud twice.
     */
    let captionAriaLabel: string | null = null;
    if (chosen !== null && chosenClassification === null) {
      captionAriaLabel = optimalMargin.accessibleLabel;
    } else if (chosenClassification !== null && sidecars.isSettled) {
      captionAriaLabel =
        withinNoiseThreshold === null
          ? `Sub-optimal: ${rolePair.accessibleLabel}. ${chosenClassification.accessibleLabel}`
          : `Within simulation noise, 95% one-sided, approximate: ${rolePair.accessibleLabel}, under the ${formatAccessibleNetLoss(withinNoiseThreshold)} point threshold. ${chosenClassification.accessibleLabel}`;
    }

    return {
      captionAriaLabel,
      chosenClassification,
      oppositeRoleLoss,
      optimalMargin,
      rolePair,
      withinNoiseThreshold,
    };
  }, [cribRole, dealtCards, scoredOptions, sidecars, tables]);
  return { ...info, quality, sidecars };
};
