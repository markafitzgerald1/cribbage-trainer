import * as classes from "./HandCard.module.css";
import { CardLabel } from "./CardLabel";
import { Rank } from "../game/Card";
import React from "react";

export interface CardProps {
  readonly dealOrderIndex: number;
  readonly kept: boolean;
  readonly onChange: (dealOrderIndex: number) => void;
  readonly rank: Rank;
}

export class HandCard extends React.Component<CardProps> {
  handleChange = () => {
    const { dealOrderIndex, onChange } = this.props;
    onChange(dealOrderIndex);
  };

  override render() {
    const { kept, rank } = this.props;
    return (
      <label
        className={`${classes.card}${kept ? "" : ` ${classes.discarded}`}`}
      >
        <CardLabel rank={rank} />
        {}
        <input
          checked={kept}
          onChange={this.handleChange}
          type="checkbox"
        />
      </label>
    );
  }
}
