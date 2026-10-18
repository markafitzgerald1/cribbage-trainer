import {
  type DeadlineJudgment,
  type RecordedAdmission,
  type SettledAdmission,
  exactAdmission,
} from "../ui/recordedAdmission";
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
import { NOISE_THRESHOLD_QUALIFIER } from "../ui/recordedHistory";
import type { ScoredKeepDiscard } from "../analysis/analysis";
import { type UncertaintySource } from "../game/uncertaintyLoader";
import { serializeHand } from "../game/Card";
import { toHandKey } from "../ui/handKey";
import { useMemo } from "react";

export interface ChosenDiagnosticInfo {
  readonly admission: RecordedAdmission | null;
  readonly captionAriaLabel: string | null;
  readonly chosenClassification: MistakeClassification | null;
  // Settles a pending admission when its wait ends, from the sidecars that have arrived by then.
  readonly judgeAtDeadline: DeadlineJudgment;
  // Hover text for the within-noise badge, saying what the badge's "within noise" means, including that the threshold is approximate; empty whenever the badge is not shown.
  readonly noiseBadgeTitle: string;
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

const noiseBadgeTitleFor = (threshold: number | null): string =>
  threshold === null
    ? ""
    : `Within noise: at or below the ${formatAccessibleNetLoss(threshold)} point threshold, ${NOISE_THRESHOLD_QUALIFIER}.`;

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

interface VerdictThresholdInput {
  readonly best: ScoredKeepDiscard<DealtCard> | undefined;
  readonly chosen: ScoredKeepDiscard<DealtCard> | null;
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];
  readonly sidecars: SidecarUncertainties;
}

// Null whenever the verdict must be given without the sidecars: none chosen yet, either sidecar unavailable, or the wait for them timed out.
const verdictThreshold = ({
  best,
  chosen,
  cribRole,
  dealtCards,
  sidecars,
}: VerdictThresholdInput): number | null =>
  best &&
  chosen &&
  !sidecars.isVerdictTimedOut &&
  sidecars.crib !== null &&
  sidecars.play !== null
    ? discardNoiseThreshold({
        best,
        chosen,
        cribUncertainty: sidecars.crib,
        knownCards: dealtCards,
        playUncertainty: sidecars.play,
        role: cribRole,
      })
    : null;

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
    verdictKey: `${toHandKey(dealtCards, cribRole)}|${serializeHand(
      dealtCards.filter((dealtCard) => !dealtCard.kept),
    )}`,
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
    const judgeWith = (judged: SidecarUncertainties) => {
      const threshold = verdictThreshold({
        best,
        chosen,
        cribRole,
        dealtCards,
        sidecars: judged,
      });
      const within =
        best &&
        chosen &&
        isWithinNoise(discardLoss({ best, chosen }), threshold)
          ? threshold
          : null;
      const settled: SettledAdmission = {
        basis: threshold === null ? "exact-fallback-v1" : "sampling-noise-v1",
        eligible: within === null,
      };
      return { settled, within };
    };
    const { settled, within: withinNoiseThreshold } = judgeWith(sidecars);
    /*
     * Judged when the decision's wait ends, which may be after this analysis
     * has left the screen: sidecars that arrived in time then decide it just
     * as they would have on screen, rather than the departure forcing the
     * exact fallback.
     */
    const judgeAtDeadline = (): SettledAdmission =>
      judgeWith({
        crib: cribUncertaintySource.getUncertaintySync(),
        isSettled: true,
        isVerdictTimedOut: false,
        play: playUncertaintySource.getUncertaintySync(),
      }).settled;
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
          : `Within simulation noise, 95% one-sided, approximate: ${rolePair.accessibleLabel}, at or below the ${formatAccessibleNetLoss(withinNoiseThreshold)} point threshold, ${NOISE_THRESHOLD_QUALIFIER}. ${chosenClassification.accessibleLabel}`;
    }

    let admission: RecordedAdmission | null = null;
    if (quality !== null) {
      admission = "pending";
      if (quality.isOptimal) admission = exactAdmission(true);
      else if (sidecars.isSettled) admission = settled;
    }
    return {
      admission,
      captionAriaLabel,
      chosenClassification,
      judgeAtDeadline,
      noiseBadgeTitle: noiseBadgeTitleFor(withinNoiseThreshold),
      oppositeRoleLoss,
      optimalMargin,
      rolePair,
      withinNoiseThreshold,
    };
  }, [
    cribRole,
    cribUncertaintySource,
    dealtCards,
    playUncertaintySource,
    quality,
    scoredOptions,
    sidecars,
    tables,
  ]);
  return { ...info, quality, sidecars };
};
