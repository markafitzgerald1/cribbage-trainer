import * as classes from "./SortableHand.module.css";
import { Hand } from "./Hand";
import { HandProps } from "./HandProps";
import React from "react";
import { SortOrderInput } from "./SortOrderInput";
import { SortOrderInputProps } from "./SortOrderInputProps";

type SortableHandProps = SortOrderInputProps & HandProps;

export function SortableHand({
  dealtCards,
  setDealtCards,
  setSortOrder,
  sortOrder,
}: SortableHandProps) {
  return (
    <div className={classes["sortable-hand"]}>
      <SortOrderInput
        setSortOrder={setSortOrder}
        sortOrder={sortOrder}
      />
      <Hand
        dealtCards={dealtCards}
        setDealtCards={setDealtCards}
        sortOrder={sortOrder}
      />
    </div>
  );
}
