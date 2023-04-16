import { CalculationsProps } from "./Calculations";
import React from "react";
import { handToSortedString } from "../handToSortedString";

export function PossibleHand({ dealtCards, sortOrder }: CalculationsProps) {
  return (
    <span className="keep-discard">
      {handToSortedString(dealtCards, sortOrder)}
    </span>
  );
}
