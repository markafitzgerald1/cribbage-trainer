/* eslint react/jsx-max-depth: ["error", { "max": 5 }] */
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
      <div className={classes.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>Hand</th>
              <th title="Points in hand before the cut">Pre-cut</th>
              <th title="Expected additional points from the cut">From Cut</th>
              <th title="Total expected hand points">Total</th>
            </tr>
          </thead>
          <tbody>
            {allScoredKeepDiscardsByExpectedScoreDescending(dealtCards).map(
              (scoredKeepDiscard) => (
                <ScoredPossibleKeepDiscard
                  discard={scoredKeepDiscard.discard}
                  expectedHandPoints={scoredKeepDiscard.expectedHandPoints}
                  handPoints={scoredKeepDiscard.handPoints}
                  keep={scoredKeepDiscard.keep}
                  key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
                    .map((dealtCard) => dealtCard.dealOrder)
                    .join("")}
                  sortOrder={sortOrder}
                />
              ),
            )}
          </tbody>
        </table>
      </div>
      <div className={classes.legend}>
        Pre-cut: Points in hand. From Cut: Expected additional. Total: Expected
        total.
      </div>
    </figure>
  );
}
