import { SortOrderName, sortOrderNames } from "../ui/SortOrderName";
import React from "react";
import { SortOrder } from "../ui/SortOrder";

interface SortOrderInputProps {
  sortOrder: SortOrder;
  setSortOrder: (sort: SortOrder) => void;
}

export class SortOrderInput extends React.Component<SortOrderInputProps> {
  static SortLabel = {
    Ascending: "↗️",
    DealOrder: "↔️",
    Descending: "↘️",
  };

  handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { setSortOrder } = this.props;
    const newSortOrder = SortOrder[event.currentTarget.value as SortOrderName];
    setSortOrder(newSortOrder);
  };

  override render() {
    const { sortOrder } = this.props;
    return (
      <div className="sort-order">
        <span>Sort: </span>
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
          {" "}
          (
          {SortOrder[sortOrder]
            .replace(
              /(?<lastLower>[a-z])(?<nextFirstUpper>[A-Z])/u,
              "$<lastLower> $<nextFirstUpper>"
            )
            .toLowerCase()}
          )
        </span>
      </div>
    );
  }
}
