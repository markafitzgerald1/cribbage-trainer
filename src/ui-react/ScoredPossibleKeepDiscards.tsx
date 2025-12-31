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
              <th aria-label="Hand composition">
                <span className={`${classes.headerStack} ${classes.headerStackStart}`}>
                  <span className={classes.headerMain}>Hand</span>
                </span>
              </th>
              <th title="Points in hand before the cut">
                <span className={classes.headerStack}>
                  <span className={classes.headerMain}>Hand</span>
                  <span
                    aria-hidden="true"
                    className={classes.headerUnit}
                  >
                    pts
                  </span>
                </span>
              </th>
              <th title="Expected additional points from the cut">
                <span className={classes.headerStack}>
                  <span className={classes.headerMain}>Cut</span>
                  <span
                    aria-hidden="true"
                    className={classes.headerUnit}
                  >
                    pts
                  </span>
                </span>
              </th>
              <th title="Total expected hand points">
                <span className={classes.headerStack}>
                  <span className={classes.headerMain}>Total</span>
                  <span
                    aria-hidden="true"
                    className={classes.headerUnit}
                  >
                    pts
                  </span>
                </span>
              </th>
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
        Hand: Points in hand. Cut: Expected additional. Total: Expected total.
      </div>
    </figure>
  );
}
