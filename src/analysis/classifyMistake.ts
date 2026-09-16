import { type Card, isSamePhysicalCard, parseHand } from "../game/Card";
import type {
  CribRole,
  ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import type {
  ExpectedPlayPoints,
  ExpectedPlayPointsTable,
} from "../game/expectedPlayPoints";
import { CARDS_PER_DISCARD } from "../game/facts";
import type { HandPoints } from "../game/handPoints";
import { allScoredKeepDiscardsByExpectedNetScoreDescending } from "./analysis";
import { withoutFloatResidue } from "./discardQuality";

export type LossComponent = "crib" | "hand" | "play";

export interface ScoredMistakeCandidate {
  readonly avgCutAddedFlushes?: number;
  readonly expectedHandPoints: number;
  readonly expectedNetPoints: number;
  readonly expectedPlayPoints: ExpectedPlayPoints;
  readonly handPointsBreakdown?: HandPoints;
  readonly signedExpectedCribPoints: number;
}

export interface MistakeClassification {
  readonly accessibleLabel: string;
  readonly cribLoss: number;
  readonly dominantComponents: readonly LossComponent[];
  readonly dominantGains: readonly LossComponent[];
  readonly gainPart: string | null;
  readonly handLoss: number;
  readonly isFlushMiss: boolean;
  readonly label: string;
  readonly lossPart: string;
  readonly netLoss: number;
  readonly playLoss: number;
  readonly shortLabel: string;
}

export interface ClassifyMistakeParams {
  readonly cards: readonly Card[];
  readonly cribRole: CribRole;
  readonly previousDiscard: string;
  readonly tables: {
    readonly crib: ExpectedCribPointsTable;
    readonly play: ExpectedPlayPointsTable;
  };
}

export const EXPECTED_POINTS_FRACTION_DIGITS = 2;
const BASE_TEN = 10;
export const DISPLAY_PRECISION = BASE_TEN ** -EXPECTED_POINTS_FRACTION_DIGITS;

export const formatNetLoss = (netLoss: number): string => {
  const rounded = Number(netLoss.toFixed(EXPECTED_POINTS_FRACTION_DIGITS));
  if (rounded === 0 && netLoss > 0) {
    return `< ${DISPLAY_PRECISION.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}`;
  }
  return netLoss.toFixed(EXPECTED_POINTS_FRACTION_DIGITS);
};

const ORDERED_COMPONENTS: readonly LossComponent[] = ["hand", "crib", "play"];

interface ComponentLosses {
  readonly crib: number;
  readonly hand: number;
  readonly play: number;
}

const getComponentLabel = (
  component: LossComponent,
  isFlushMiss: boolean,
): string => {
  if (component === "hand") {
    return isFlushMiss ? "Missed flush" : "Hand";
  }
  if (component === "crib") {
    return "Crib";
  }
  return "Play";
};

const getComponentLoss = (
  component: LossComponent,
  losses: ComponentLosses,
): number => {
  if (component === "hand") {
    return losses.hand;
  }
  if (component === "crib") {
    return losses.crib;
  }
  return losses.play;
};

const computeComponentLosses = (
  best: ScoredMistakeCandidate,
  chosen: ScoredMistakeCandidate,
): ComponentLosses => ({
  crib: withoutFloatResidue(
    best.signedExpectedCribPoints - chosen.signedExpectedCribPoints,
  ),
  hand: withoutFloatResidue(
    best.expectedHandPoints - chosen.expectedHandPoints,
  ),
  play: withoutFloatResidue(
    best.expectedPlayPoints.delta - chosen.expectedPlayPoints.delta,
  ),
});

const getDominantLossComponents = (
  losses: ComponentLosses,
): readonly LossComponent[] =>
  ORDERED_COMPONENTS.filter(
    (component) => getComponentLoss(component, losses) >= DISPLAY_PRECISION,
  );

const getMaterialGainComponents = (
  losses: ComponentLosses,
): readonly LossComponent[] =>
  ORDERED_COMPONENTS.filter(
    (component) => -getComponentLoss(component, losses) >= DISPLAY_PRECISION,
  );

const getFlushExpectedPoints = (candidate: ScoredMistakeCandidate): number =>
  (candidate.handPointsBreakdown?.flushes ?? 0) +
  (candidate.avgCutAddedFlushes ?? 0);

const isFlushMissMistake = (
  best: ScoredMistakeCandidate,
  chosen: ScoredMistakeCandidate,
  handLoss: number,
): boolean => {
  const bestFlushEV = getFlushExpectedPoints(best);
  if (bestFlushEV <= 0) {
    return false;
  }
  const chosenFlushEV = getFlushExpectedPoints(chosen);
  const flushLoss = withoutFloatResidue(bestFlushEV - chosenFlushEV);
  if (flushLoss < DISPLAY_PRECISION) {
    return false;
  }
  const remainingHandLoss = withoutFloatResidue(handLoss - flushLoss);
  return (
    withoutFloatResidue(remainingHandLoss - flushLoss) <= DISPLAY_PRECISION
  );
};

const formatComponentItem = (
  component: LossComponent,
  amount: number,
  isFlushMiss: boolean,
): string =>
  `${amount.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)} ${getComponentLabel(component, isFlushMiss)}`;

const formatComponentList = (
  items: readonly string[],
  separator: string,
  suffix: "gain" | "loss",
): string => `${items.join(separator)} ${suffix}`;

export const classifyScoredMistake = (
  best: ScoredMistakeCandidate,
  chosen: ScoredMistakeCandidate,
): MistakeClassification | null => {
  const netLoss = withoutFloatResidue(
    best.expectedNetPoints - chosen.expectedNetPoints,
  );
  if (netLoss <= 0) {
    return null;
  }

  const losses = computeComponentLosses(best, chosen);
  const dominantComponents = getDominantLossComponents(losses);
  const dominantGains = getMaterialGainComponents(losses);
  const isFlushMiss =
    dominantComponents.includes("hand") &&
    isFlushMissMistake(best, chosen, losses.hand);

  const lossItems = dominantComponents.map((component) =>
    formatComponentItem(
      component,
      getComponentLoss(component, losses),
      isFlushMiss,
    ),
  );
  const gainItems = dominantGains.map((component) =>
    formatComponentItem(component, -getComponentLoss(component, losses), false),
  );

  const lossPart = formatComponentList(lossItems, " + ", "loss");
  const gainPart =
    dominantGains.length > 0
      ? formatComponentList(gainItems, " + ", "gain")
      : null;
  const label = gainPart === null ? lossPart : `${gainPart} < ${lossPart}`;

  const accessibleLossPart = formatComponentList(lossItems, " and ", "loss");
  const accessibleGainPart =
    dominantGains.length > 0
      ? formatComponentList(gainItems, " and ", "gain")
      : null;
  const coverVerb =
    dominantGains.length > 1 ? "do not cover" : "does not cover";
  const accessibleLabel =
    accessibleGainPart === null
      ? accessibleLossPart
      : `${accessibleGainPart} ${coverVerb} ${accessibleLossPart}`;

  const lossLabel = dominantComponents
    .map((component) => getComponentLabel(component, isFlushMiss))
    .join(", ");
  const gainLabel = dominantGains
    .map((component) => getComponentLabel(component, false))
    .join(", ");
  const shortLabel =
    dominantGains.length > 0 ? `${lossLabel} > ${gainLabel}` : lossLabel;

  return {
    accessibleLabel,
    cribLoss: losses.crib,
    dominantComponents,
    dominantGains,
    gainPart,
    handLoss: losses.hand,
    isFlushMiss,
    label,
    lossPart,
    netLoss,
    playLoss: losses.play,
    shortLabel,
  };
};

const parsePreviousDiscardSafely = (
  previousDiscard: string,
): readonly Card[] | null => {
  try {
    const cards = parseHand(previousDiscard);
    return cards.length === CARDS_PER_DISCARD ? cards : null;
  } catch {
    return null;
  }
};

export const classifyMistake = ({
  cards,
  cribRole,
  previousDiscard,
  tables,
}: ClassifyMistakeParams): MistakeClassification | null => {
  const chosenDiscardCards = parsePreviousDiscardSafely(previousDiscard);
  if (chosenDiscardCards === null) {
    return null;
  }

  const scored = allScoredKeepDiscardsByExpectedNetScoreDescending(
    cards,
    cribRole,
    tables,
  );

  const chosen = scored.find((option) =>
    option.discard.every((card) =>
      chosenDiscardCards.some((chosenCard) =>
        isSamePhysicalCard(chosenCard, card),
      ),
    ),
  );

  const [best] = scored;
  if (!best || !chosen) {
    return null;
  }
  return classifyScoredMistake(best, chosen);
};
