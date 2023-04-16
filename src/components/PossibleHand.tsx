import { CalculationsProps } from "./Calculations";
import React from "react";
import { handToString } from "../handToString";

export function PossibleHand({ dealtCards, sortOrder }: CalculationsProps) {
  return (
    <span className="keep-discard">{handToString(dealtCards, sortOrder)}</span>
  );
}
