/* istanbul ignore file */
import React, { useState } from "react";
import { DealtCard } from "../game/DealtCard";

export function DealComponentContainer({
  dealtHand,
  createComponent,
}: {
  dealtHand: readonly DealtCard[];
  createComponent: ({
    dealtCards,
    setDealtCards,
  }: {
    dealtCards: readonly DealtCard[];
    setDealtCards: React.Dispatch<React.SetStateAction<readonly DealtCard[]>>;
  }) => JSX.Element;
}) {
  const [dealtCards, setDealtCards] = useState<readonly DealtCard[]>(dealtHand);
  return <div>{createComponent({ dealtCards, setDealtCards })}</div>;
}
