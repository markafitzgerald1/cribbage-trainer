import { ByRoleMatcher, ByRoleOptions, render } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import React from "react";
import { Trainer } from "./Trainer";
import { UserEvent } from "@testing-library/user-event/dist/types/setup/setup";
import userEvent from "@testing-library/user-event";

describe("trainer component", () => {
  const headingText = "Cribbage Trainer";
  const mathRandom = Math.random;

  it(`has heading text '${headingText}'`, () => {
    expect(
      render(<Trainer generateRandomNumber={mathRandom} />).queryByText(
        headingText,
      ),
    ).toBeTruthy();
  });

  it("initially contains a sort in descending order radio input", () => {
    expect(
      render(<Trainer generateRandomNumber={mathRandom} />).queryByLabelText(
        "↘️",
      ),
    ).toBeTruthy();
  });

  it("contains a dealt hand", () => {
    expect(
      render(<Trainer generateRandomNumber={mathRandom} />).queryByText(
        "Dealt hand:",
      ),
    ).toBeTruthy();
  });

  const preCutHandPoints = "Pre-cut hand points:";

  const clickIndices = (
    getAllByRole: (
      role: ByRoleMatcher,
      options?: ByRoleOptions | undefined,
    ) => HTMLElement[],
    indices: number[],
    user: UserEvent,
  ) =>
    Promise.all(
      indices.map((index) => user.click(getAllByRole("checkbox")[index]!)),
    );

  const expectCalculationsAfterClicks = async (
    cardIndices: number[],
    calculationsExpected: boolean,
  ) => {
    const user = userEvent.setup();
    const { getAllByRole, queryByText } = render(
      <Trainer generateRandomNumber={mathRandom} />,
    );

    await clickIndices(getAllByRole, cardIndices, user);

    expect(Boolean(queryByText(preCutHandPoints))).toBe(calculationsExpected);
  };

  it("contains pre-cut hand points possibilities once two cards have been selected", async () => {
    await expectCalculationsAfterClicks([0, 1], true);
  });

  it("hides pre-cut hand points possibilities once two cards have been selected and then one of them is unselected", async () => {
    await expectCalculationsAfterClicks([0, 1, 1], false);
  });

  it("hides pre-cut hand points possibilities if more than two cards are selected", async () => {
    const moreThanTwo = 3;
    await expectCalculationsAfterClicks([...Array(moreThanTwo).keys()], false);
  });
});
