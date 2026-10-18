import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import { useCallback, useId, useState } from "react";
import { NOISE_THRESHOLD_QUALIFIER } from "../ui/recordedHistory";
import type { RoleLossPairLabel } from "../analysis/oppositeRoleLoss";
import { formatNetLoss } from "../analysis/classifyMistake";
import { renderRoleLossPairText } from "./RoleLossPairText";

interface NoiseVerdictBadgeProps {
  readonly rolePair: RoleLossPairLabel;
  readonly threshold: number;
  readonly title: string;
}

/*
 * A title is invisible on a touch screen, so the same threshold and its
 * qualifier are also revealed on tap (#914).
 */
export function NoiseVerdictBadge({
  rolePair,
  threshold,
  title,
}: NoiseVerdictBadgeProps) {
  const explanationId = useId();
  const [isExplained, setIsExplained] = useState(false);
  const handleToggle = useCallback(
    () => setIsExplained((explained) => !explained),
    [],
  );
  return (
    <>
      <button
        aria-controls={explanationId}
        aria-expanded={isExplained}
        className={classes.noiseBadge}
        onClick={handleToggle}
        title={title}
        type="button"
      >
        Within noise: {renderRoleLossPairText(rolePair)}
      </button>
      {isExplained ? (
        <span
          className={classes.noiseExplanation}
          id={explanationId}
        >
          Approximate threshold {formatNetLoss(threshold)} pts:{" "}
          {NOISE_THRESHOLD_QUALIFIER}.
        </span>
      ) : null}
    </>
  );
}
