import { formatAccessibleNetLoss, formatNetLoss } from "./classifyMistake";
import { withoutFloatResidue } from "./discardQuality";

export interface OptimalDiscardMargin {
  readonly accessibleLabel: string;
  readonly label: string;
  readonly margin: number | null;
}

export const isEqualBestCandidate = (
  bestNet: number,
  candidateNet: number,
): boolean => withoutFloatResidue(bestNet - candidateNet) === 0;

export const computeOptimalDiscardMargin = (
  scoredCandidatesByNetDescending: readonly {
    readonly expectedNetPoints: number;
  }[],
): OptimalDiscardMargin => {
  const [bestCandidate] = scoredCandidatesByNetDescending;
  if (!bestCandidate) {
    return {
      accessibleLabel: "Optimal discard",
      label: "Optimal discard",
      margin: null,
    };
  }

  const bestNet = bestCandidate.expectedNetPoints;
  const runnerUp = scoredCandidatesByNetDescending.find(
    (candidate) =>
      withoutFloatResidue(bestNet - candidate.expectedNetPoints) > 0,
  );

  if (!runnerUp) {
    const allTiedText = "Optimal discard, all tied";
    return {
      accessibleLabel: allTiedText,
      label: allTiedText,
      margin: null,
    };
  }

  const margin = withoutFloatResidue(bestNet - runnerUp.expectedNetPoints);
  const formattedMargin = formatNetLoss(margin);
  const accessibleMargin = formatAccessibleNetLoss(margin);

  return {
    accessibleLabel: `Optimal discard, ${accessibleMargin} better than next`,
    label: `Optimal discard, ${formattedMargin} better than next`,
    margin,
  };
};
