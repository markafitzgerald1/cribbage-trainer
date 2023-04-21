import { describe, expect, it, jest } from "@jest/globals";
import { Card } from "./Card";
import { DealtCard } from "../game/DealtCard";
import React from "react";
import { createCard } from "../game/Card";
import { render } from "@testing-library/react";

describe("card", () => {
  it("returns a list item", () => {
    const dealtCards: readonly DealtCard[] = [
      { ...createCard(0), dealOrder: 0, kept: false },
    ];
    const setDealtCards = jest.fn();

    const { queryByRole } = render(
      <Card
        dealOrderIndex={0}
        dealtCards={dealtCards}
        setDealtCards={setDealtCards}
      />
    );

    expect(queryByRole("listitem")).toBeTruthy();
  });
});
