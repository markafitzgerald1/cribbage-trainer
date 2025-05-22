// src/ui-react/ScoredPossibleKeepDiscards.tsx
import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { allScoredKeepDiscardsByExpectedScoreDescending } from "../analysis/analysis";
import { useState, useCallback } from "react";

export interface ScoredPossibleKeepDiscardsProps {
  readonly dealtCards: readonly DealtCard[];
  readonly sortOrder: SortOrder;
}

export function ScoredPossibleKeepDiscards({
  dealtCards,
  sortOrder,
}: ScoredPossibleKeepDiscardsProps) {
  const [showInfo, setShowInfo] = useState(false);
  const toggleShowInfo = useCallback(() => {
    setShowInfo(prevShow => !prevShow);
  }, []);

  const scoredKeepDiscards = allScoredKeepDiscardsByExpectedScoreDescending(dealtCards);

  return (
    <figure className={classes.scoredPossibleKeepDiscardsContainer}>
      <figcaption className={classes.headerWithInfoIcon}>
        Expected Points
        <button
          type="button"
          className={classes.infoIconButton}
          onClick={toggleShowInfo}
          aria-expanded={showInfo}
          aria-controls="analysis-info-details"
          title="Information about expected points"
        >
          ⓘ
        </button>
      </figcaption>
      {showInfo && (
        <div id="analysis-info-details" className={classes.infoDetailsPanel}>
          Each option shows the total average points expected.
          Tap any option (or the ▶ icon) to see its detailed breakdown:
          Points from Hand + Average Points from Starter Cut.
        </div>
      )}
      <ul className={classes.analysisList}>
        {scoredKeepDiscards.map((item) => ( // 'item' is used here
          <ScoredPossibleKeepDiscard
            key={`item-${item.keep.map(c=>c.dealOrder).join('')}-${item.discard.map(c=>c.dealOrder).join('')}`}
            discard={item.discard}
            expectedHandPoints={item.expectedHandPoints}
            handPoints={item.handPoints}
            keep={item.keep}
            sortOrder={sortOrder}
          />
        ))}
      </ul>
    </figure>
  );
}
