import * as classes from "./SortOrderInput.module.css";
import React, { useCallback } from "react";
import { SORT_ORDER_NAMES, type SortOrderName } from "../ui/SortOrderName";
import { SortOrder } from "../ui/SortOrder";
import { v4 } from "uuid";

interface SortOrderInputProps {
  readonly onChange: (sortOrder: SortOrder) => void;
  readonly sortOrder: SortOrder;
}

export const SortLabel: Record<SortOrderName, string> = {
  Ascending: "↑",
  DealOrder: "🂠",
  Descending: "↓",
} as const;

export function SortOrderInput({ sortOrder, onChange }: SortOrderInputProps) {
  const handleChange = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      onChange(SortOrder[event.currentTarget.value as SortOrderName]);
    },
    [onChange],
  );

  const name = `sort-${v4()}`;

  return (
    <fieldset className={classes.sortOrderInput}>
      <legend className={classes.legend}>Sort</legend>
      {SORT_ORDER_NAMES.map((key) => (
        // eslint-disable-next-line security/detect-object-injection
        <span key={SortOrder[key]}>
          <input
            aria-label={key}
            // eslint-disable-next-line security/detect-object-injection
            checked={sortOrder === SortOrder[key]}
            className={classes.input}
            id={key}
            name={name}
            onChange={handleChange}
            type="radio"
            // eslint-disable-next-line security/detect-object-injection
            value={SortOrder[SortOrder[key]]}
          />
          <label
            className={classes.label}
            htmlFor={key}
            title={`${key} Sort`}
          >
            {
              // eslint-disable-next-line security/detect-object-injection
              SortLabel[key]
            }
          </label>
        </span>
      ))}
    </fieldset>
  );
}
