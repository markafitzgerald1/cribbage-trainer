import { DealtCard } from "../DealtCard";
import { DealtCardsHook } from "./DealtCardsHook";
import React from "react";
import { Sort } from "../Sort";
import { SortName } from "../SortName";

const compareFns = {
  [Sort.Ascending]: (first: DealtCard, second: DealtCard) =>
    first.rankValue - second.rankValue,
  [Sort.Descending]: (first: DealtCard, second: DealtCard) =>
    second.rankValue - first.rankValue,
  [Sort.DealOrder]: (first: DealtCard, second: DealtCard) =>
    first.dealOrder - second.dealOrder,
};

interface SortOrderProps extends DealtCardsHook {
  sortOrder: Sort;
  setSortOrder: (sort: Sort) => void;
}

export class SortOrder extends React.Component<SortOrderProps> {
  static SortLabel = {
    Ascending: "↗️",
    DealOrder: "↔️",
    Descending: "↘️",
  };

  handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { dealtCards, setDealtCards, setSortOrder } = this.props;
    const newSortOrder = Sort[event.currentTarget.value as SortName];
    setSortOrder(newSortOrder);
    setDealtCards([...dealtCards].sort(compareFns[newSortOrder]));
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
          {Sort[sortOrder]
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
