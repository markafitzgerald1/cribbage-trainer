import React from "react";
import { Sort } from "../Sort";
import { SortName } from "../SortName";

export class SortOrder extends React.Component<{
  sortOrder: Sort;
  setSortOrder: (sortOrder: SortName) => void;
}> {
  static SortLabel = {
    Ascending: "↗️",
    DealOrder: "↔️",
    Descending: "↘️",
  };

  handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { setSortOrder } = this.props;
    setSortOrder(event.currentTarget.value as SortName);
  };

  override render() {
    const { sortOrder } = this.props;
    return (
      <div className="sort-order">
        <span>Sort: </span>
        {Object.keys(Sort)
          .filter((key) => isNaN(Number(key)))
          .map((key) => key as SortName)
          .map((key) => (
            <span key={Sort[key]}>
              <input
                checked={sortOrder === Sort[key]}
                id={key}
                name="sort"
                onChange={this.handleChange}
                type="radio"
                value={Sort[Sort[key]]}
              />
              <label htmlFor={key}>{SortOrder.SortLabel[key]}</label>
            </span>
          ))}
        <span className="sort-order-description">
          {" "}
          (
          {(Sort[sortOrder] as string)
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
