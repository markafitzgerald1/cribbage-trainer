import * as classes from "./SortOrderInput.module.css";
import {
  SORT_ORDER_NAMES,
  SortOrderName,
  lowerCaseSpaceSeparatedSortOrderName,
} from "../ui/SortOrderName";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { v4 } from "uuid";

interface SortOrderInputProps {
  readonly onChange: (sortOrder: SortOrder) => void;
  readonly sortOrder: SortOrder;
}

export const SortLabel: Record<SortOrderName, string> = {
  Ascending: "↗️",
  DealOrder: "↔️",
  Descending: "↘️",
} as const;

export class SortOrderInput extends React.Component<SortOrderInputProps> {
  handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { onChange } = this.props;
    onChange(SortOrder[event.currentTarget.value as SortOrderName]);
  };

  override render() {
    const { sortOrder } = this.props;
    const name = `sort-${v4()}`;
    return (
      <fieldset className={classes.fieldset}>
        <legend className={classes.legend}>Sort</legend>
        {SORT_ORDER_NAMES.map((key) => (
          // eslint-disable-next-line security/detect-object-injection
          <span key={SortOrder[key]}>
            <input
              // eslint-disable-next-line security/detect-object-injection
              checked={sortOrder === SortOrder[key]}
              className={classes.input}
              id={key}
              name={name}
              onChange={this.handleChange}
              type="radio"
              // eslint-disable-next-line security/detect-object-injection
              value={SortOrder[SortOrder[key]]}
            />
            <label
              className={classes.label}
              htmlFor={key}
            >
              {
                // eslint-disable-next-line security/detect-object-injection
                SortLabel[key]
              }
            </label>
          </span>
        ))}
        <span className={classes.description}>
          {
            lowerCaseSpaceSeparatedSortOrderName[
              // eslint-disable-next-line security/detect-object-injection
              SortOrder[sortOrder] as SortOrderName
            ]
          }
        </span>
      </fieldset>
    );
  }
}
