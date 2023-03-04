import { DealtCard } from "./DealtCard";
import React from "react";

export type CardProps = {
  dealtCard: DealtCard;
  toggleKept: () => void;
};

export function Card({
  dealtCard: { kept, rankLabel },
  toggleKept,
}: CardProps) {
  return (
    <li
      className={`card${kept ? "" : " discarded"}`}
      onClick={toggleKept}
    >
      {rankLabel}
    </li>
  );
}
