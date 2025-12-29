import * as classes from "./ScoredPossibleKeepDiscards.module.css";
import type { DealtCard } from "../game/DealtCard";
import { ScoredPossibleKeepDiscard } from "./ScoredPossibleKeepDiscard";
import { SortOrder } from "../ui/SortOrder";
import { allScoredKeepDiscardsByExpectedScoreDescending } from "../analysis/analysis";

export interface ScoredPossibleKeepDiscardsProps {
  readonly dealtCards: readonly DealtCard[];
  readonly sortOrder: SortOrder;
}

export function ScoredPossibleKeepDiscards({
  dealtCards,
  sortOrder,
}: ScoredPossibleKeepDiscardsProps) {
  return (

    <figure className={classes.scoredPossibleKeepDiscards}>
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
      <div aria-label="Post-Starter Points" className={classes.grid} role="table">
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, spellcheck/spell-checker */}
        <div className={classes.header} role="columnheader">Keep</div>
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, spellcheck/spell-checker */}
        <div className={classes.header} role="columnheader">Discard</div>
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, spellcheck/spell-checker */}
        <div className={classes.header} role="columnheader">Pre-cut</div>
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, spellcheck/spell-checker */}
        <div className={classes.header} role="columnheader">From cut</div>
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, spellcheck/spell-checker */}
        <div className={classes.header} role="columnheader">Total</div>
        {allScoredKeepDiscardsByExpectedScoreDescending(dealtCards).map(
          ({ keep, discard, handPoints, expectedHandPoints }, index) => (
            <ScoredPossibleKeepDiscard
              discard={discard}
              expectedHandPoints={expectedHandPoints}
              handPoints={handPoints}
              keep={keep}
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              sortOrder={sortOrder}
            />
          ),
        )}
      </div>
    </figure>
  );
}
