import * as classes from "./Card.module.css";
import React from "react";

export interface CardProps {
  readonly dealOrderIndex: number;
  readonly onChange: (dealOrderIndex: number) => void;
  readonly kept: boolean;
  readonly rankLabel: string;
}

export class Card extends React.Component<CardProps> {
  handleChange = () => {
    const { dealOrderIndex, onChange } = this.props;
    onChange(dealOrderIndex);
  };

  override render() {
    const { dealOrderIndex, kept, rankLabel } = this.props;
    const id = `card-checkbox-${dealOrderIndex}`;
    return (
      <div
        className={`${classes.card}${kept ? "" : ` ${classes.discarded}`}${
          rankLabel === "10" ? ` ${classes.ten}` : ""
        }`}
      >
        <label htmlFor={id}>
          <div>{rankLabel}</div>
        </label>
        <input
          checked={kept}
          id={id}
          onChange={this.handleChange}
          type="checkbox"
        />
      </div>
    );
  }
}
