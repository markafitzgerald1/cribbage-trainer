import * as classes from "./PossibleHandCard.module.css";
import { DealtCard } from "../game/DealtCard";
import React from "react";

interface PossibleHandCardProps {
  readonly dealtCard: DealtCard;
}

export function PossibleHandCard({ dealtCard }: PossibleHandCardProps) {
  return (
    <span
      className={`${classes.card}${
        dealtCard.rankLabel === "10" ? ` ${classes.ten}` : ""
      }`}
      key={dealtCard.dealOrder}
    >
      <div>{dealtCard.rankLabel}</div>
    </span>
  );
}
