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
  readonly comparisonOperator: "<" | "<=";
  readonly cribLoss: number;
  readonly gainPart: string | null;
  readonly handLoss: number;
  readonly isFlushMiss: boolean;
  readonly label: string;
  readonly lossPart: string;
  readonly materialComponents: readonly LossComponent[];
  readonly materialGains: readonly LossComponent[];
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
const CENTS_PER_POINT = BASE_TEN ** EXPECTED_POINTS_FRACTION_DIGITS;

const toDisplayedCents = (amount: number): number =>
  Math.round(
    Number(amount.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)) * CENTS_PER_POINT,
  );

const formatLossAmount = (netLoss: number, subCentPrefix: string): string => {
  const rounded = Number(netLoss.toFixed(EXPECTED_POINTS_FRACTION_DIGITS));
  if (rounded === 0 && netLoss > 0) {
    return `${subCentPrefix} ${DISPLAY_PRECISION.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}`;
  }
  return netLoss.toFixed(EXPECTED_POINTS_FRACTION_DIGITS);
};

export const formatNetLoss = (netLoss: number): string =>
  formatLossAmount(netLoss, "<");

export const formatAccessibleNetLoss = (netLoss: number): string =>
  formatLossAmount(netLoss, "less than");

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

const getMaterialLossComponents = (
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
  const remainingHandLoss = Math.abs(withoutFloatResidue(handLoss - flushLoss));
  return remainingHandLoss <= DISPLAY_PRECISION;
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

interface FormattedMistakeLabels {
  readonly accessibleLabel: string;
  readonly comparisonOperator: "<" | "<=";
  readonly gainPart: string | null;
  readonly label: string;
  readonly lossPart: string;
  readonly shortLabel: string;
}

interface MistakeLabelInput {
  readonly isFlushMiss: boolean;
  readonly losses: ComponentLosses;
  readonly materialComponents: readonly LossComponent[];
  readonly materialGains: readonly LossComponent[];
}

const buildMistakeLabels = ({
  isFlushMiss,
  losses,
  materialComponents,
  materialGains,
}: MistakeLabelInput): FormattedMistakeLabels => {
  const lossItems = materialComponents.map((component) =>
    formatComponentItem(
      component,
      getComponentLoss(component, losses),
      isFlushMiss,
    ),
  );
  const gainItems = materialGains.map((component) =>
    formatComponentItem(component, -getComponentLoss(component, losses), false),
  );

  const lossPart = formatComponentList(lossItems, " + ", "loss");
  const gainPart =
    materialGains.length > 0
      ? formatComponentList(gainItems, " + ", "gain")
      : null;

  const totalGainCents = materialGains.reduce(
    (sum, component) =>
      sum + toDisplayedCents(-getComponentLoss(component, losses)),
    0,
  );
  const totalLossCents = materialComponents.reduce(
    (sum, component) =>
      sum + toDisplayedCents(getComponentLoss(component, losses)),
    0,
  );
  const comparisonOperator: "<" | "<=" =
    totalGainCents === totalLossCents ? "<=" : "<";

  const label =
    gainPart === null
      ? lossPart
      : `${gainPart} ${comparisonOperator} ${lossPart}`;

  const accessibleLossPart = formatComponentList(lossItems, " and ", "loss");
  const accessibleGainPart =
    materialGains.length > 0
      ? formatComponentList(gainItems, " and ", "gain")
      : null;
  const quite = comparisonOperator === "<=" ? "quite " : "";
  const coverVerb =
    materialGains.length > 1
      ? `do not ${quite}cover`
      : `does not ${quite}cover`;
  const accessibleLabel =
    accessibleGainPart === null
      ? accessibleLossPart
      : `${accessibleGainPart} ${coverVerb} ${accessibleLossPart}`;

  const lossLabel = materialComponents
    .map((component) => getComponentLabel(component, isFlushMiss))
    .join(", ");
  const gainLabel = materialGains
    .map((component) => getComponentLabel(component, false))
    .join(", ");
  const shortLabel =
    materialGains.length > 0
      ? `${gainLabel} gain ${comparisonOperator} ${lossLabel} loss`
      : `${lossLabel} loss`;

  return {
    accessibleLabel,
    comparisonOperator,
    gainPart,
    label,
    lossPart,
    shortLabel,
  };
};

const createSubPrecisionClassification = (
  losses: ComponentLosses,
  netLoss: number,
): MistakeClassification => {
  const formattedThreshold = DISPLAY_PRECISION.toFixed(
    EXPECTED_POINTS_FRACTION_DIGITS,
  );
  const lossPart = `< ${formattedThreshold} loss`;
  return {
    accessibleLabel: `less than ${formattedThreshold} loss`,
    comparisonOperator: "<",
    cribLoss: losses.crib,
    gainPart: null,
    handLoss: losses.hand,
    isFlushMiss: false,
    label: lossPart,
    lossPart,
    materialComponents: [],
    materialGains: [],
    netLoss,
    playLoss: losses.play,
    shortLabel: lossPart,
  };
};

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
  const materialComponents = getMaterialLossComponents(losses);
  const materialGains = getMaterialGainComponents(losses);

  if (materialComponents.length === 0) {
    return createSubPrecisionClassification(losses, netLoss);
  }

  const isFlushMiss =
    materialComponents.includes("hand") &&
    isFlushMissMistake(best, chosen, losses.hand);

  const labels = buildMistakeLabels({
    isFlushMiss,
    losses,
    materialComponents,
    materialGains,
  });

  return {
    accessibleLabel: labels.accessibleLabel,
    comparisonOperator: labels.comparisonOperator,
    cribLoss: losses.crib,
    gainPart: labels.gainPart,
    handLoss: losses.hand,
    isFlushMiss,
    label: labels.label,
    lossPart: labels.lossPart,
    materialComponents,
    materialGains,
    netLoss,
    playLoss: losses.play,
    shortLabel: labels.shortLabel,
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
