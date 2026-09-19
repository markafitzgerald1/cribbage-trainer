import * as classes from "./RoleLossPairText.module.css";
import type { RoleLossPairLabel } from "../analysis/oppositeRoleLoss";

/*
 * Shared by the analysis caption and the mistake queue card, which show the
 * same pair in differently styled badges: both need the reversed-role figure
 * in an element of its own so it can be marked, and jscpd counts the second
 * spelling of that composition as a clone.
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
