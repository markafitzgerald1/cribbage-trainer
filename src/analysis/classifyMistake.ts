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
  readonly handLoss: number;
  readonly label: string;
  readonly netLoss: number;
  readonly playLoss: number;
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

const getComponentAbsLoss = (
  component: LossComponent,
  losses: ComponentLosses,
): number => {
  if (component === "hand") {
    return Math.abs(losses.hand);
  }
  if (component === "crib") {
    return Math.abs(losses.crib);
  }
  return Math.abs(losses.play);
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

  const handLoss = withoutFloatResidue(
    best.expectedHandPoints - chosen.expectedHandPoints,
  );
  const cribLoss = withoutFloatResidue(
    best.signedExpectedCribPoints - chosen.signedExpectedCribPoints,
  );
  const playLoss = withoutFloatResidue(
    best.expectedPlayPoints.delta - chosen.expectedPlayPoints.delta,
  );

  const maxContribution = Math.max(
    Math.abs(handLoss),
    Math.abs(cribLoss),
    Math.abs(playLoss),
  );

  const losses: ComponentLosses = {
    crib: cribLoss,
    hand: handLoss,
    play: playLoss,
  };

  const dominantComponents = ORDERED_COMPONENTS.filter((component) => {
    const absLoss = getComponentAbsLoss(component, losses);
    return withoutFloatResidue(maxContribution - absLoss) <= DISPLAY_PRECISION;
  });

  const label = dominantComponents.map(getComponentLabel).join(", ");

  return {
    cribLoss,
    dominantComponents,
    handLoss,
    label,
    netLoss,
    playLoss,
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
