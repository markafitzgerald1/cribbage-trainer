import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { SortOrder } from "../ui/SortOrder";
import { SortOrderInput } from "./SortOrderInput";
import { render } from "@testing-library/react";

describe("sort order input component", () => {
  it("contains a group", () => {
    const { queryByRole } = render(
      <SortOrderInput
        setSortOrder={jest.fn()}
        sortOrder={SortOrder.Ascending}
      />
    );

    expect(queryByRole("group")).toBeTruthy();
  });
});
