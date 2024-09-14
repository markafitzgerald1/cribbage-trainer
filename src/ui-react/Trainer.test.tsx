import "@testing-library/jest-dom";
import { ByRoleMatcher, ByRoleOptions, render } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { SortOrder } from "../ui/SortOrder";
import { Trainer } from "./Trainer";
import { act } from "react";

describe("trainer component", () => {
  const mathRandom = Math.random;

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

  const preCutHandPoints = "Pre-cut hand";

  const clickIndices = (
    getAllByRole: (
      role: ByRoleMatcher,
      options?: ByRoleOptions,
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

    await act(() => clickIndices(getAllByRole, cardIndices, user));

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

  it.each([SortOrder.Ascending, SortOrder.DealOrder])(
    "re-sorts the dealt hand when the sort order is changed to %s",
    async (newSortOrder) => {
      const { container } = render(
        <Trainer generateRandomNumber={mathRandom} />,
      );
      const newSortInput = container.querySelector(
        `input[value='${SortOrder[newSortOrder]}']`,
      )!;
      const initialDealtHand = container.querySelector("div")!.textContent;
      const user = userEvent.setup();

      await act(() => user.click(newSortInput));

      expect(container.querySelector("div")!.textContent).not.toBe(
        initialDealtHand,
      );
    },
  );

  const ANALYTICS_CONSENT = "analyticsConsent";

  const clearAnalyticsConsent = () =>
    localStorage.removeItem(ANALYTICS_CONSENT);

  it.each([
    [true, 0],
    [false, 1],
  ])(
    "persists that analytics acceptance is %s when button %d is clicked",
    async (expectedConsent, buttonIndex) => {
      clearAnalyticsConsent();
      const user = userEvent.setup();
      const { container } = render(
        <Trainer generateRandomNumber={mathRandom} />,
      );
      const acceptDeclineButton =
        container.querySelectorAll("button")[buttonIndex]!;

      await act(() => user.click(acceptDeclineButton));

      expect(localStorage.getItem(ANALYTICS_CONSENT)).toBe(
        expectedConsent.toString(),
      );
    },
  );

  it("initially sets the analytics consent based on local storage", () => {
    localStorage.setItem(ANALYTICS_CONSENT, "true");
    const renderResult = render(<Trainer generateRandomNumber={mathRandom} />);

    expect(
      renderResult.getByText(
        /^Thank you! Your consent helps us improve our site using tools like Google Analytics. /u,
      ),
    ).toBeInTheDocument();
  });
});
