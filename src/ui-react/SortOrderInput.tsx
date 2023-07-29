import {
  SortOrderName,
  lowerCaseSpaceSeparatedSortOrderName,
  sortOrderNames,
} from "../ui/SortOrderName";
import React from "react";
import { SortOrder } from "../ui/SortOrder";

interface SortOrderInputProps {
  readonly sortOrder: SortOrder;
  readonly setSortOrder: (sort: SortOrder) => void;
}

export class SortOrderInput extends React.Component<SortOrderInputProps> {
  static SortLabel: Record<SortOrderName, string> = {
    Ascending: "↗️",
    DealOrder: "↔️",
    Descending: "↘️",
  } as const;

  handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { setSortOrder } = this.props;
    const newSortOrder = SortOrder[event.currentTarget.value as SortOrderName];
    setSortOrder(newSortOrder);
  };

  override render() {
    const { sortOrder } = this.props;
    return (
      <fieldset className="sort-order">
        <legend>Sort</legend>
        {sortOrderNames.map((key) => (
          <span key={SortOrder[key]}>
            <input
              checked={sortOrder === SortOrder[key]}
              id={key}
              name="sort"
              onChange={this.handleChange}
              type="radio"
              value={SortOrder[SortOrder[key]]}
            />
            <label htmlFor={key}>{SortOrderInput.SortLabel[key]}</label>
          </span>
        ))}
        <span className="sort-order-description">
          {
            lowerCaseSpaceSeparatedSortOrderName[
              SortOrder[sortOrder] as SortOrderName
            ]
          }
        </span>
      </fieldset>
    );
  }
}
