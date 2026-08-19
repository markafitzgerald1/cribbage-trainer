import {
  type ByRoleMatcher,
  type ByRoleOptions,
  render,
  screen,
} from "@testing-library/react";
import { Trainer, type TrainerProps } from "./Trainer";
import { expect, jest } from "@jest/globals";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import { type ExpectedCribPointsTable } from "../game/expectedCribPoints";
import { type ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import type { UserEvent } from "@testing-library/user-event";
import expectedCribPointsTableData from "../game/expectedCribPointsTable.json";
import expectedPlayPointsTableData from "../game/expectedPlayPointsTable.json";
import { setTableSync as setCribTableSync } from "../game/expectedCribPointsTableLoader";
import { setTableSync as setPlayTableSync } from "../game/expectedPlayPointsTableLoader";

export const mathRandom = Math.random;
const CARD_DRAW_RANDOM_VALUE = 0;
export const DEALER_RANDOM_VALUE = 0.49;
export const PONE_RANDOM_VALUE = 0.5;

// Both tables, because analysis only renders with both, and a rendered analysis is what ends first-instinct status.
export const setAnalysisTables = () => {
  setCribTableSync(
    expectedCribPointsTableData as unknown as ExpectedCribPointsTable,
  );
  setPlayTableSync(
    expectedPlayPointsTableData as unknown as ExpectedPlayPointsTable,
  );
};

export const renderTrainerWithGenerator = (
  generateRandomNumber: () => number,
  trackEvent: TrainerProps["trackEvent"] = jest.fn(),
) => {
  setAnalysisTables();

  return render(
    <Trainer
      generateRandomNumber={generateRandomNumber}
      loadGoogleAnalytics={jest.fn()}
      trackEvent={trackEvent}
    />,
  );
};

export const renderTrainer = () => renderTrainerWithGenerator(mathRandom);

type InitialTrainerProps = Partial<
  Pick<
    TrainerProps,
    | "initialCards"
    | "initialCribRole"
    | "initialDiscards"
    | "initialScoreSortKey"
    | "initialSortOrder"
    | "isSeededSession"
    | "trackEvent"
  >
>;

export const renderTrainerWithInitialProps = ({
  initialCards = null,
  initialCribRole = null,
  initialDiscards,
  initialScoreSortKey = null,
  initialSortOrder = null,
  isSeededSession = false,
  trackEvent = jest.fn(),
}: InitialTrainerProps) =>
  render(
    <Trainer
      generateRandomNumber={mathRandom}
      initialCards={initialCards}
      initialCribRole={initialCribRole}
      initialDiscards={initialDiscards ?? null}
      initialScoreSortKey={initialScoreSortKey}
      initialSortOrder={initialSortOrder}
      isSeededSession={isSeededSession}
      loadGoogleAnalytics={jest.fn()}
      trackEvent={trackEvent}
    />,
  );

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

export const SIX_SPADES_HAND = "AS,2S,3S,4S,5S,6S";
