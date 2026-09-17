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
const GAIN_SIGN_MULTIPLIER = -1;
const LOSS_SIGN_MULTIPLIER = 1;
const ADJUST_DECREMENT = -1;
const ADJUST_INCREMENT = 1;

const toDisplayedCents = (amount: number): number =>
  Math.round(
    Number(amount.toFixed(EXPECTED_POINTS_FRACTION_DIGITS)) * CENTS_PER_POINT,
  );

const formatLossAmount = (netLoss: number, subCentPrefix: string): string => {
  if (netLoss > 0 && netLoss < DISPLAY_PRECISION) {
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
  [...components].sort((firstComponent, secondComponent) => {
    const diff = getCents(secondComponent) - getCents(firstComponent);
    if (diff !== 0) {
      return diff;
    }
    return (
      ORDERED_COMPONENTS.indexOf(firstComponent) -
      ORDERED_COMPONENTS.indexOf(secondComponent)
    );
  });

const getMaterialComponentsBySign = (
  losses: ComponentLosses,
  multiplier: typeof LOSS_SIGN_MULTIPLIER | typeof GAIN_SIGN_MULTIPLIER,
): readonly LossComponent[] => {
  const getContribution = (component: LossComponent) =>
    multiplier * getComponentLoss(component, losses);
  return sortComponentsByCents(
    ORDERED_COMPONENTS.filter(
      (component) => getContribution(component) >= DISPLAY_PRECISION,
    ),
    (component) => toDisplayedCents(getContribution(component)),
  );
};

const getMaterialLossComponents = (
  losses: ComponentLosses,
): readonly LossComponent[] =>
  getMaterialComponentsBySign(losses, LOSS_SIGN_MULTIPLIER);

const getMaterialGainComponents = (
  losses: ComponentLosses,
): readonly LossComponent[] =>
  getMaterialComponentsBySign(losses, GAIN_SIGN_MULTIPLIER);

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

interface MistakeLabelInput extends Pick<
  MistakeClassification,
  "materialComponents" | "materialGains" | "netLoss"
> {
  readonly isFlushMiss: boolean;
  readonly losses: ComponentLosses;
}

interface ComponentCents {
  cents: number;
  readonly component: LossComponent;
  error: number;
  readonly isLoss: boolean;
}

const adjustComponentDelta = (
  componentList: ComponentCents[],
  isExcess: boolean,
): void => {
  const candidates = componentList.filter((item) =>
    item.isLoss === isExcess ? item.cents > 1 : true,
  );
  candidates.sort((first, second) => {
    const errorDiff = isExcess
      ? second.error - first.error
      : first.error - second.error;
    if (errorDiff !== 0) {
      return errorDiff;
    }
    return (
      ORDERED_COMPONENTS.indexOf(first.component) -
      ORDERED_COMPONENTS.indexOf(second.component)
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const chosen = candidates[0]!;
  chosen.cents +=
    chosen.isLoss === isExcess ? ADJUST_DECREMENT : ADJUST_INCREMENT;
  chosen.error += isExcess ? ADJUST_DECREMENT : ADJUST_INCREMENT;
};

const reconcileComponentCents = (
  input: MistakeLabelInput,
  targetNetCents: number,
): ReadonlyMap<LossComponent, number> => {
  const componentList: ComponentCents[] = [
    ...input.materialComponents.map((component) => {
      const rawLoss = getComponentLoss(component, input.losses);
      const initialCents = toDisplayedCents(rawLoss);
      return {
        cents: initialCents,
        component,
        error: initialCents - rawLoss * CENTS_PER_POINT,
        isLoss: true,
      };
    }),
    ...input.materialGains.map((component) => {
      const rawGain = -getComponentLoss(component, input.losses);
      const initialCents = toDisplayedCents(rawGain);
      return {
        cents: initialCents,
        component,
        error: rawGain * CENTS_PER_POINT - initialCents,
        isLoss: false,
      };
    }),
  ];

  const computeImpliedNetCents = (): number =>
    componentList.reduce(
      (sum, item) => sum + (item.isLoss ? item.cents : -item.cents),
      0,
    );

  let delta = computeImpliedNetCents() - targetNetCents;
  while (delta > 0) {
    adjustComponentDelta(componentList, true);
    delta -= 1;
  }
  while (delta < 0) {
    adjustComponentDelta(componentList, false);
    delta += 1;
  }

  return new Map(componentList.map((item) => [item.component, item.cents]));
};

const formatComponentItem = (
  component: LossComponent,
  cents: number,
  isFlushMiss: boolean,
): string =>
  `${(cents / CENTS_PER_POINT).toFixed(EXPECTED_POINTS_FRACTION_DIGITS)} ${getComponentLabel(component, isFlushMiss)}`;

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

const formatAccessibleMistakeLabel = (
  accessibleLossPart: string,
  gainItems: readonly string[],
  comparisonOperator: "<" | "<=",
): string => {
  if (gainItems.length === 0) {
    return accessibleLossPart;
  }
  const accessibleGainPart = formatComponentList(gainItems, " and ", "gain");
  const quite = comparisonOperator === "<=" ? "quite " : "";
  const coverVerb =
    gainItems.length > 1 ? `do not ${quite}cover` : `does not ${quite}cover`;
  return `${accessibleGainPart} ${coverVerb} ${accessibleLossPart}`;
};

const formatShortMistakeLabel = (
  input: MistakeLabelInput,
  comparisonOperator: "<" | "<=",
): string => {
  const lossLabel = input.materialComponents
    .map((component) => getComponentLabel(component, input.isFlushMiss))
    .join(", ");
  if (input.materialGains.length === 0) {
    return `${lossLabel} loss`;
  }
  const gainLabel = input.materialGains
    .map((component) => getComponentLabel(component, false))
    .join(", ");
  return `${gainLabel} gain ${comparisonOperator} ${lossLabel} loss`;
};

const buildMistakeLabels = (
  input: MistakeLabelInput,
): FormattedMistakeLabels | null => {
  const targetNetCents = toDisplayedCents(input.netLoss);
  const reconciledCents =
    targetNetCents > 0 ? reconcileComponentCents(input, targetNetCents) : null;

  const getCents = (component: LossComponent, isLoss: boolean): number => {
    if (reconciledCents !== null) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return reconciledCents.get(component)!;
    }
    const raw = isLoss
      ? getComponentLoss(component, input.losses)
      : -getComponentLoss(component, input.losses);
    return toDisplayedCents(raw);
  };

  const sortedLosses = sortComponentsByCents(
    input.materialComponents,
    (component) => getCents(component, true),
  );
  const sortedGains = sortComponentsByCents(input.materialGains, (component) =>
    getCents(component, false),
  );

  const lossItems = sortedLosses.map((component) =>
    formatComponentItem(
      component,
      getCents(component, true),
      input.isFlushMiss,
    ),
  );
  const gainItems = sortedGains.map((component) =>
    formatComponentItem(component, getCents(component, false), false),
  );

  const totalGainCents = sortedGains.reduce(
    (sum, component) => sum + getCents(component, false),
    0,
  );
  const totalLossCents = sortedLosses.reduce(
    (sum, component) => sum + getCents(component, true),
    0,
  );
  if (totalGainCents > totalLossCents) {
    return null;
  }
  const comparisonOperator: "<" | "<=" =
    totalGainCents === totalLossCents ? "<=" : "<";

  const lossPart = formatComponentList(lossItems, " + ", "loss");
  const gainPart =
    gainItems.length > 0 ? formatComponentList(gainItems, " + ", "gain") : null;
  const label =
    gainPart === null
      ? lossPart
      : `${gainPart} ${comparisonOperator} ${lossPart}`;

  const accessibleLossPart = formatComponentList(lossItems, " and ", "loss");
  const accessibleLabel = formatAccessibleMistakeLabel(
    accessibleLossPart,
    gainItems,
    comparisonOperator,
  );
  const shortLabel = formatShortMistakeLabel(input, comparisonOperator);

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
    netLoss,
  });

  if (labels === null) {
    return createSubPrecisionClassification(losses, netLoss);
  }

  return {
    ...labels,
    cribLoss: losses.crib,
    handLoss: losses.hand,
    isFlushMiss,
    materialComponents,
    materialGains,
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
