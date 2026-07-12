import {
  type ByRoleMatcher,
  type ByRoleOptions,
  render,
  screen,
} from "@testing-library/react";
import { expect, jest } from "@jest/globals";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import { type ExpectedCribPointsTable } from "../game/expectedCribPoints";
import { Trainer } from "./Trainer";
import type { UserEvent } from "@testing-library/user-event";
import expectedCribPointsTableData from "../game/expectedCribPointsTable.json";
import { setTableSync } from "../game/expectedCribPointsTableLoader";

export const mathRandom = Math.random;
const CARD_DRAW_RANDOM_VALUE = 0;
export const DEALER_RANDOM_VALUE = 0.49;
export const PONE_RANDOM_VALUE = 0.5;

export const setCribTable = () => {
  setTableSync(
    expectedCribPointsTableData as unknown as ExpectedCribPointsTable,
  );
};

export const renderTrainerWithGenerator = (
  generateRandomNumber: () => number,
) => {
  setCribTable();

  return render(
    <Trainer
      generateRandomNumber={generateRandomNumber}
      loadGoogleAnalytics={jest.fn()}
    />,
  );
};

export const renderTrainer = () => renderTrainerWithGenerator(mathRandom);

export const createSequenceGenerator = (values: number[]) =>
  jest.fn(() => values.shift() ?? 0);

const repeatedRandomValues = (value: number): number[] =>
  Array.from({ length: CARDS_PER_DEALT_HAND }, () => value);

export const createRoleRandomValues = (roleValues: readonly number[]) =>
  roleValues.flatMap((roleValue) => [
    ...repeatedRandomValues(CARD_DRAW_RANDOM_VALUE),
    roleValue,
  ]);

export const renderTrainerShowingDealerRole = () =>
  renderTrainerWithGenerator(
    createSequenceGenerator(createRoleRandomValues([DEALER_RANDOM_VALUE])),
  );

export const calculationsHeaderName = "Hand";

export const clickIndices = (
  getAllByRole: (role: ByRoleMatcher, options?: ByRoleOptions) => HTMLElement[],
  indices: number[],
  user: UserEvent,
) =>
  indices.reduce(
    (previousClick, index) =>
      previousClick.then(() => user.click(getAllByRole("checkbox")[index]!)),
    Promise.resolve(),
  );

const isRoleLabelVisible = (roleName: string, roleContext: string) =>
  Boolean(screen.queryByText(roleName)) &&
  Boolean(screen.queryByText(roleContext));

export const expectDealerRoleVisible = () => {
  expect(isRoleLabelVisible("Dealer", "your crib")).toBe(true);
};

export const expectPoneRoleVisible = () => {
  expect(isRoleLabelVisible("Pone", "opponent crib")).toBe(true);
};

export const clickDeal = (user: UserEvent) =>
  user.click(screen.getByRole("button", { name: "Deal" }));

export const getHandText = (container: HTMLElement) =>
  container.querySelector("ul")!.textContent;

export const SIX_HEARTS_HAND = "AH,2H,3H,4H,5H,6H";
