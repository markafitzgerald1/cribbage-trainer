import * as classes from "./RoleLossPairText.module.css";
import type { RoleLossPairLabel } from "../analysis/oppositeRoleLoss";

/*
 * Shared by the analysis caption and the mistake queue card, whose badges
 * differ but whose pair does not: jscpd counts a second spelling as a clone.
 * A label with no reversed-role clause renders as the plain single figure.
 */
export const renderRoleLossPairText = (
  pair: RoleLossPairLabel,
): React.JSX.Element => (
  <>
    {pair.leadingText}
    <span className={pair.oppositeRoleCostsNothing ? classes.costsNothing : ""}>
      {pair.oppositeRoleCost}
    </span>
  </>
);
