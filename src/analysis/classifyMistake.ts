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

export const SIGNIFICANT_GAIN_THRESHOLD = 0.25;
export const SIGNIFICANT_GAIN_RATIO = 0.2;

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

  const handLoss = withoutFloatResidue(
    best.expectedHandPoints - chosen.expectedHandPoints,
  );
  const cribLoss = withoutFloatResidue(
    best.signedExpectedCribPoints - chosen.signedExpectedCribPoints,
  );
  const playLoss = withoutFloatResidue(
    best.expectedPlayPoints.delta - chosen.expectedPlayPoints.delta,
  );

  const maxLoss = Math.max(0, handLoss, cribLoss, playLoss);

  const losses: ComponentLosses = {
    crib: cribLoss,
    hand: handLoss,
    play: playLoss,
  };

  const gains: ComponentLosses = {
    crib: -cribLoss,
    hand: -handLoss,
    play: -playLoss,
  };

  const dominantComponents = ORDERED_COMPONENTS.filter((component) => {
    const loss = getComponentLoss(component, losses);
    return loss > 0 && withoutFloatResidue(maxLoss - loss) <= DISPLAY_PRECISION;
  });

  const maxGain = Math.max(0, -handLoss, -cribLoss, -playLoss);
  const hasSignificantGain =
    maxGain >= SIGNIFICANT_GAIN_THRESHOLD &&
    maxGain >= withoutFloatResidue(SIGNIFICANT_GAIN_RATIO * maxLoss);

  const dominantGains = hasSignificantGain
    ? ORDERED_COMPONENTS.filter((component) => {
        const gain = getComponentLoss(component, gains);
        return (
          gain > 0 && withoutFloatResidue(maxGain - gain) <= DISPLAY_PRECISION
        );
      })
    : [];

  const lossLabel = dominantComponents.map(getComponentLabel).join(", ");
  const gainLabel = dominantGains.map(getComponentLabel).join(", ");

  const label =
    dominantGains.length > 0
      ? `${lossLabel} loss > ${gainLabel} gain`
      : lossLabel;

  const shortLabel =
    dominantGains.length > 0 ? `${lossLabel} > ${gainLabel}` : lossLabel;

  return {
    cribLoss,
    dominantComponents,
    dominantGains,
    handLoss,
    label,
    netLoss,
    playLoss,
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
