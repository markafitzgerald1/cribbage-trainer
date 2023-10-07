import * as classes from "./PossibleHand.module.css";
import { CalculationsProps } from "./Calculations";
import React from "react";
import { handToSortedString } from "../ui/handToSortedString";

export function PossibleHand({ dealtCards, sortOrder }: CalculationsProps) {
  return (
    <span className={classes["keep-discard"]}>
      {handToSortedString(dealtCards, sortOrder)}
    </span>
  );
}
