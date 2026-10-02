import { type Card, parseHand } from "../game/Card";
import {
  type ScoredKeepDiscard,
  allScoredKeepDiscardsByExpectedNetScoreDescending,
} from "../analysis/analysis";
import { type ClassifyMistakeParams } from "../analysis/classifyMistake";
import { type DiscardDecisionRecord } from "./discardDecisionRecord";
import { type Uncertainty } from "../game/uncertaintySidecar";
import { isChosenDiscard } from "../analysis/discardQuality";
import { noiseVerdictThreshold } from "../analysis/discardNoiseThreshold";
import { parseHandKey } from "./handKey";

export interface NoiseCandidate extends DiscardDecisionRecord {
  readonly discardKey: string;
}

// No decision is within noise: every exact verdict stands.
export const NO_NOISE: ReadonlySet<string> = new Set();

export const noiseVerdictKey = ({
  discardKey,
  handKey,
}: Pick<DiscardDecisionRecord, "discardKey" | "handKey">) =>
  `${handKey}#${discardKey}`;

// Only an authentic, exactly sub-optimal decision with a recorded discard can be judged.
export const isNoiseCandidate = (
  record: DiscardDecisionRecord,
): record is NoiseCandidate =>
  !record.isPractice &&
  !record.isOptimal &&
  record.expectedPointsLoss > 0 &&
  record.discardKey !== null;

export const isRecordWithinNoise = (
  record: DiscardDecisionRecord,
  withinNoise: ReadonlySet<string>,
): boolean => !record.isPractice && withinNoise.has(noiseVerdictKey(record));

export const countWithinNoise = (
  records: readonly DiscardDecisionRecord[],
  withinNoise: ReadonlySet<string>,
): number =>
  records.filter((record) => isRecordWithinNoise(record, withinNoise)).length;

// Recomputed from the stored hand and discard, as the caption judges its hand, never from a stored loss or verdict (#774).
export const isRecordedDiscardWithinNoise = (
  { discardKey, handKey }: Pick<NoiseCandidate, "discardKey" | "handKey">,
  tables: ClassifyMistakeParams["tables"],
  sidecars: { readonly crib: Uncertainty; readonly play: Uncertainty },
): boolean => {
  const hand = parseHandKey(handKey);
  if (hand === null) {
    return false;
  }
  const discard = parseHand(discardKey);
  const scored = allScoredKeepDiscardsByExpectedNetScoreDescending(
    hand.cards,
    hand.cribRole,
    tables,
  );
  const chosen = scored.find((option) => isChosenDiscard(option, discard));
  // A discard the hand never held is corrupt storage, and keeps the exact verdict; fifteen are always scored, so a best exists.
  return chosen
    ? noiseVerdictThreshold({
        best: scored.at(0) as ScoredKeepDiscard<Card>,
        chosen,
        cribUncertainty: sidecars.crib,
        knownCards: hand.cards,
        playUncertainty: sidecars.play,
        role: hand.cribRole,
      }) !== null
    : false;
};
