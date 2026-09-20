import { type Card, parseHand } from "../game/Card";
import type {
  CribRole,
  ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import type {
  ExpectedPlayPoints,
  ExpectedPlayPointsTable,
} from "../game/expectedPlayPoints";
import { isChosenDiscard, withoutFloatResidue } from "./discardQuality";
import { CARDS_PER_DISCARD } from "../game/facts";
import type { HandPoints } from "../game/handPoints";
import { allScoredKeepDiscardsByExpectedNetScoreDescending } from "./analysis";

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
const GAIN_SIGN_MULTIPLIER = -1;
const LOSS_SIGN_MULTIPLIER = 1;

const toDisplayedCents = (amount: number): number =>
  Math.round(
    Number(amount.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)) * CENTS_PER_POINT,
  );

const formatLossAmount = (netLoss: number, subCentPrefix: string): string =>
  netLoss > 0 && netLoss < DISPLAY_PRECISION
    ? `${subCentPrefix} ${DISPLAY_PRECISION.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)}`
    : netLoss.toFixed(EXPECTED_POINTS_FRACTION_DIGITS);

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
  return component === "crib" ? "Crib" : "Play";
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

const sortComponentsByCents = (
  components: readonly LossComponent[],
  getCents: (component: LossComponent) => number,
): readonly LossComponent[] =>
  [...components].sort(
    (first, second) =>
      getCents(second) - getCents(first) ||
      ORDERED_COMPONENTS.indexOf(first) - ORDERED_COMPONENTS.indexOf(second),
  );

const getMaterialComponentsBySign = (
  losses: ComponentLosses,
  multiplier: typeof LOSS_SIGN_MULTIPLIER | typeof GAIN_SIGN_MULTIPLIER,
): readonly LossComponent[] => {
  const getCents = (component: LossComponent) =>
    toDisplayedCents(multiplier * getComponentLoss(component, losses));
  return sortComponentsByCents(
    ORDERED_COMPONENTS.filter((component) => getCents(component) > 0),
    getCents,
  );
};

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
  const flushLoss = withoutFloatResidue(
    bestFlushEV - getFlushExpectedPoints(chosen),
  );
  return (
    flushLoss >= DISPLAY_PRECISION &&
    toDisplayedCents(handLoss) === toDisplayedCents(flushLoss)
  );
};

interface MistakeLabelInput extends Pick<
  MistakeClassification,
  "materialComponents" | "materialGains"
> {
  readonly isFlushMiss: boolean;
  readonly losses: ComponentLosses;
}

const formatComponentItem = (
  component: LossComponent,
  cents: number,
  isFlushMiss: boolean,
): string =>
  `${(cents / CENTS_PER_POINT).toFixed(EXPECTED_POINTS_FRACTION_DIGITS)} ${getComponentLabel(component, isFlushMiss)}`;

type FormattedMistakeLabels = Omit<
  MistakeClassification,
  "cribLoss" | "handLoss" | "netLoss" | "playLoss"
>;

const formatAccessibleMistakeLabel = (
  lossItems: readonly string[],
  gainItems: readonly string[],
  comparisonOperator: "<" | "<=",
): string => {
  const accessibleLossPart = `${lossItems.join(" and ")} loss`;
  if (gainItems.length === 0) {
    return accessibleLossPart;
  }
  const accessibleGainPart = `${gainItems.join(" and ")} gain`;
  const quite = comparisonOperator === "<=" ? "quite " : "";
  const verb = `do${gainItems.length > 1 ? "" : "es"} not ${quite}cover`;
  return `${accessibleGainPart} ${verb} ${accessibleLossPart}`;
};

type ShortLabelInput = Pick<
  FormattedMistakeLabels,
  "comparisonOperator" | "isFlushMiss" | "materialComponents" | "materialGains"
>;

const formatShortMistakeLabel = (labels: ShortLabelInput): string => {
  const lossLabel = labels.materialComponents
    .map((component) => getComponentLabel(component, labels.isFlushMiss))
    .join(", ");
  if (labels.materialGains.length === 0) {
    return `${lossLabel} loss`;
  }
  const gainLabel = labels.materialGains
    .map((component) => getComponentLabel(component, false))
    .join(", ");
  return `${gainLabel} gain ${labels.comparisonOperator} ${lossLabel} loss`;
};

const buildMistakeLabels = (
  input: MistakeLabelInput,
): FormattedMistakeLabels | null => {
  const getCents = (component: LossComponent, isLoss: boolean): number =>
    toDisplayedCents(
      (isLoss ? LOSS_SIGN_MULTIPLIER : GAIN_SIGN_MULTIPLIER) *
        getComponentLoss(component, input.losses),
    );

  const lossItems = input.materialComponents.map((component) =>
    formatComponentItem(
      component,
      getCents(component, true),
      input.isFlushMiss,
    ),
  );
  const gainItems = input.materialGains.map((component) =>
    formatComponentItem(component, getCents(component, false), false),
  );

  const totalGainCents = input.materialGains.reduce(
    (sum, component) => sum + getCents(component, false),
    0,
  );
  const totalLossCents = input.materialComponents.reduce(
    (sum, component) => sum + getCents(component, true),
    0,
  );
  if (totalGainCents > totalLossCents) {
    return null;
  }
  const comparisonOperator: "<" | "<=" =
    totalGainCents === totalLossCents ? "<=" : "<";

  const lossPart = `${lossItems.join(" + ")} loss`;
  const gainPart =
    gainItems.length > 0 ? `${gainItems.join(" + ")} gain` : null;
  const label =
    gainPart === null
      ? lossPart
      : `${gainPart} ${comparisonOperator} ${lossPart}`;

  const accessibleLabel = formatAccessibleMistakeLabel(
    lossItems,
    gainItems,
    comparisonOperator,
  );
  const shortLabel = formatShortMistakeLabel({
    comparisonOperator,
    isFlushMiss: input.isFlushMiss,
    materialComponents: input.materialComponents,
    materialGains: input.materialGains,
  });

  return {
    accessibleLabel,
    comparisonOperator,
    gainPart,
    isFlushMiss: input.isFlushMiss,
    label,
    lossPart,
    materialComponents: input.materialComponents,
    materialGains: input.materialGains,
    shortLabel,
  };
};

const createSubPrecisionClassification = (
  losses: ComponentLosses,
  netLoss: number,
): MistakeClassification => {
  const threshold = DISPLAY_PRECISION.toFixed(EXPECTED_POINTS_FRACTION_DIGITS);
  const lossPart = `< ${threshold} loss`;
  return {
    accessibleLabel: `less than ${threshold} loss`,
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
  const materialComponents = getMaterialComponentsBySign(
    losses,
    LOSS_SIGN_MULTIPLIER,
  );
  const materialGains = getMaterialComponentsBySign(
    losses,
    GAIN_SIGN_MULTIPLIER,
  );

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

  return labels === null
    ? createSubPrecisionClassification(losses, netLoss)
    : {
        ...labels,
        cribLoss: losses.crib,
        handLoss: losses.hand,
        netLoss,
        playLoss: losses.play,
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
    isChosenDiscard(option, chosenDiscardCards),
  );

  const [best] = scored;
  return best && chosen ? classifyScoredMistake(best, chosen) : null;
};
