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
import { allScoredKeepDiscardsByExpectedNetScoreDescending } from "./analysis";
import { withoutFloatResidue } from "./discardQuality";

export type LossComponent = "crib" | "hand" | "play";

export interface ScoredMistakeCandidate {
  readonly expectedHandPoints: number;
  readonly expectedNetPoints: number;
  readonly expectedPlayPoints: ExpectedPlayPoints;
  readonly signedExpectedCribPoints: number;
}

export interface MistakeClassification {
  readonly cribLoss: number;
  readonly dominantComponents: readonly LossComponent[];
  readonly dominantGains: readonly LossComponent[];
  readonly handLoss: number;
  readonly label: string;
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

const ORDERED_COMPONENTS: readonly LossComponent[] = ["hand", "crib", "play"];

interface ComponentLosses {
  readonly crib: number;
  readonly hand: number;
  readonly play: number;
}

const getComponentLabel = (component: LossComponent): string => {
  if (component === "hand") {
    return "Hand";
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
): readonly LossComponent[] => {
  const maxLoss = Math.max(0, losses.hand, losses.crib, losses.play);
  return ORDERED_COMPONENTS.filter((component) => {
    const loss = getComponentLoss(component, losses);
    return loss > 0 && withoutFloatResidue(maxLoss - loss) <= DISPLAY_PRECISION;
  });
};

const getDominantGainComponents = (
  losses: ComponentLosses,
): readonly LossComponent[] => {
  const maxGain = Math.max(0, -losses.hand, -losses.crib, -losses.play);
  if (maxGain < DISPLAY_PRECISION) {
    return [];
  }
  return ORDERED_COMPONENTS.filter((component) => {
    const gain = -getComponentLoss(component, losses);
    return (
      gain >= DISPLAY_PRECISION &&
      withoutFloatResidue(maxGain - gain) <= DISPLAY_PRECISION
    );
  });
};

const getContributingLossComponents = (
  dominantLosses: readonly LossComponent[],
  dominantGains: readonly LossComponent[],
  losses: ComponentLosses,
): readonly LossComponent[] => {
  if (dominantGains.length === 0) {
    return dominantLosses;
  }
  const dominantLossTotal = dominantLosses.reduce(
    (sum, component) =>
      withoutFloatResidue(sum + getComponentLoss(component, losses)),
    0,
  );
  const maxGain = dominantGains.reduce(
    (max, component) => Math.max(max, -getComponentLoss(component, losses)),
    0,
  );
  if (dominantLossTotal >= maxGain) {
    return dominantLosses;
  }
  return ORDERED_COMPONENTS.filter(
    (component) => getComponentLoss(component, losses) >= DISPLAY_PRECISION,
  );
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
  const dominantComponents = getDominantLossComponents(losses);
  const dominantGains = getDominantGainComponents(losses);
  const contributingLosses = getContributingLossComponents(
    dominantComponents,
    dominantGains,
    losses,
  );

  const lossLabel = contributingLosses.map(getComponentLabel).join(", ");
  const gainLabel = dominantGains.map(getComponentLabel).join(", ");

  const label =
    dominantGains.length > 0
      ? `${lossLabel} loss > ${gainLabel} gain`
      : lossLabel;

  const shortLabel =
    dominantGains.length > 0 ? `${lossLabel} > ${gainLabel}` : lossLabel;

  return {
    cribLoss: losses.crib,
    dominantComponents,
    dominantGains,
    handLoss: losses.hand,
    label,
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
