import "@testing-library/jest-dom";
import {
  type ByRoleMatcher,
  type ByRoleOptions,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { CARD_LABELS, Rank, type Suit, parseHand } from "../game/Card";
import { type ComparableCard, sortCards } from "../ui/sortCards";
import {
  CribRole,
  type ExpectedCribPointsTable,
} from "../game/expectedCribPoints";
import { describe, expect, it, jest } from "@jest/globals";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import { SortOrder } from "../ui/SortOrder";
import { Trainer } from "./Trainer";
import expectedCribPointsTableData from "../game/expectedCribPointsTable.json";
import { setTableSync } from "../game/expectedCribPointsTableLoader";

const mathRandom = Math.random;
const CARD_DRAW_RANDOM_VALUE = 0;
const DEALER_RANDOM_VALUE = 0.49;
const PONE_RANDOM_VALUE = 0.5;

const renderTrainerWithGenerator = (generateRandomNumber: () => number) => {
  setTableSync(
    expectedCribPointsTableData as unknown as ExpectedCribPointsTable,
  );

  return render(
    <Trainer
      generateRandomNumber={generateRandomNumber}
      loadGoogleAnalytics={jest.fn()}
    />,
  );
};

const renderTrainer = () => renderTrainerWithGenerator(mathRandom);

const createSequenceGenerator = (values: number[]) =>
  jest.fn(() => values.shift() ?? 0);

const repeatedRandomValues = (value: number): number[] =>
  Array.from({ length: CARDS_PER_DEALT_HAND }, () => value);

const createRoleRandomValues = (roleValues: readonly number[]) =>
  roleValues.flatMap((roleValue) => [
    ...repeatedRandomValues(CARD_DRAW_RANDOM_VALUE),
    roleValue,
  ]);

const calculationsHeaderName = "Hand";

const clickIndices = (
  getAllByRole: (role: ByRoleMatcher, options?: ByRoleOptions) => HTMLElement[],
  indices: number[],
  user: UserEvent,
) =>
  indices.reduce(
    (previousClick, index) =>
      previousClick.then(() => user.click(getAllByRole("checkbox")[index]!)),
    Promise.resolve(),
  );

const toggleCard = async (checkbox: HTMLElement, user: UserEvent) => {
  await user.click(checkbox);
};

const expectCalculationsAfterClicks = async (
  cardIndices: number[],
  calculationsExpected: boolean,
) => {
  const user = userEvent.setup();
  const { getAllByRole, queryByRole } = renderTrainer();

  await clickIndices(getAllByRole, cardIndices, user);

  expect(
    Boolean(queryByRole("columnheader", { name: calculationsHeaderName })),
  ).toBe(calculationsExpected);
};

const handTextToComparableCards = (
  initialDealtHand: string,
): ComparableCard[] => {
  const regex = /(?<rankLabel>10|[A2-9JQK])(?<suit>[♣♦♥♠])/gu;
  const matches = Array.from(initialDealtHand.matchAll(regex));

  return matches.map((match, index) => {
    const { rankLabel, suit } = match.groups!;

    return {
      dealOrder: index,
      rank: CARD_LABELS.indexOf(rankLabel!) as Rank,
      suit: suit as Suit,
    };
  });
};

function getSortInput(container: HTMLElement, sortOrder: SortOrder) {
  return container.querySelector(
    `input[value='${Object.keys(SortOrder).find((key) => SortOrder[key as keyof typeof SortOrder] === sortOrder)}']`,
  )!;
}

const ANALYTICS_CONSENT = "analyticsConsent";

const clearAnalyticsConsent = () => localStorage.removeItem(ANALYTICS_CONSENT);

const isRoleLabelVisible = (roleName: string, roleContext: string) =>
  Boolean(screen.queryByText(roleName)) &&
  Boolean(screen.queryByText(roleContext));

const expectDealerRoleVisible = () => {
  expect(isRoleLabelVisible("Dealer", "your crib")).toBe(true);
};

const expectPoneRoleVisible = () => {
  expect(isRoleLabelVisible("Pone", "opponent crib")).toBe(true);
};

const clickDeal = (user: UserEvent) =>
  user.click(screen.getByRole("button", { name: "Deal" }));

const renderTrainerShowingDealerRole = () =>
  renderTrainerWithGenerator(
    createSequenceGenerator(createRoleRandomValues([DEALER_RANDOM_VALUE])),
  );

const getHandText = (container: HTMLElement) =>
  container.querySelector("ul")!.textContent;

const SIX_HEARTS_HAND = "AH,2H,3H,4H,5H,6H";

describe("trainer component", () => {
  it("initially contains a sort in descending order radio input", () => {
    expect(renderTrainer().queryByLabelText("↓")).toBeTruthy();
  });

  it("contains a dealt hand", () => {
    expect(renderTrainer().queryByText("Hand")).toBeTruthy();
  });

  it("shows the randomized dealer role", () => {
    renderTrainerShowingDealerRole();

    expectDealerRoleVisible();
  });

  it("randomizes the role on a new deal", async () => {
    const user = userEvent.setup();

    renderTrainerWithGenerator(
      createSequenceGenerator(
        createRoleRandomValues([DEALER_RANDOM_VALUE, PONE_RANDOM_VALUE]),
      ),
    );

    expectDealerRoleVisible();

    await clickDeal(user);

    expectPoneRoleVisible();
  });

  it("contains hand points once two cards have been selected", async () => {
    await expectCalculationsAfterClicks([0, 1], true);
  });

  it("hides hand points once two cards have been selected and then one of them is unselected", async () => {
    await expectCalculationsAfterClicks([0, 1, 1], false);
  });

  it("hides hand points if more than two cards are selected", async () => {
    const moreThanTwo = 3;
    await expectCalculationsAfterClicks([...Array(moreThanTwo).keys()], false);
  });

  it.each([SortOrder.Ascending, SortOrder.Descending])(
    "re-sorts the dealt hand when the sort order is changed to %s",
    async (newSortOrder) => {
      const { container } = renderTrainer();
      const user = userEvent.setup();
      const sortInDealOrderInput = getSortInput(container, SortOrder.DealOrder);
      await user.click(sortInDealOrderInput);
      const expectedSortedCards = sortCards(
        handTextToComparableCards(container.querySelector("ul")!.textContent),
        newSortOrder,
      )
        .map((dealtCard) => `${CARD_LABELS[dealtCard.rank]}${dealtCard.suit}`)
        .join("");
      const newSortInput = getSortInput(container, newSortOrder);

      await user.click(newSortInput);

      expect(container.querySelector("ul")!.textContent).toBe(
        expectedSortedCards,
      );
    },
  );

  it.each([
    [true, "Accept"],
    [false, "Decline"],
  ])(
    "persists that analytics acceptance is %s when button %s is clicked",
    async (expectedConsent, buttonText) => {
      clearAnalyticsConsent();
      const user = userEvent.setup();
      renderTrainer();

      const button = screen.getByRole("button", { name: buttonText });

      await user.click(button);

      expect(localStorage.getItem(ANALYTICS_CONSENT)).toBe(
        expectedConsent.toString(),
      );
    },
  );

  it("initially shows only Privacy Policy link when consent is in local storage", () => {
    localStorage.setItem(ANALYTICS_CONSENT, "true");
    const renderResult = renderTrainer();

    expect(renderResult.getByText("Privacy Policy")).toBeTruthy();
    expect(
      renderResult.queryByText(/^Thank you! Your consent helps/u),
    ).toBeFalsy();
  });

  it("deals new cards after a 'Deal' button click", async () => {
    const { container } = renderTrainer();
    const dealButton = screen.getByRole("button", { name: "Deal" });
    const user = userEvent.setup();
    const initialDealtHand = container.querySelector("ul")!.textContent;

    await user.click(dealButton);

    expect(container.querySelector("ul")!.textContent).not.toBe(
      initialDealtHand,
    );
  });

  it("renders the specified initialCards", () => {
    const initialCards = parseHand(SIX_HEARTS_HAND);
    const { container } = render(
      <Trainer
        generateRandomNumber={mathRandom}
        initialCards={initialCards}
        loadGoogleAnalytics={jest.fn()}
      />,
    );

    expect(container.querySelector("ul")!.textContent).toBe("6♥5♥4♥3♥2♥A♥");
  });

  it("toggles card selection", async () => {
    const user = userEvent.setup();
    const { getAllByRole } = renderTrainer();
    const firstCheckbox = getAllByRole("checkbox")[0]!;

    expect(firstCheckbox).toBeChecked();

    await toggleCard(firstCheckbox, user);

    expect(firstCheckbox).not.toBeChecked();

    await toggleCard(firstCheckbox, user);

    expect(firstCheckbox).toBeChecked();
  });
});

const HAND_PARAM_PATTERN =
  /^(?:10|[A2-9JQK])[CDHS](?:,(?:10|[A2-9JQK])[CDHS]){5}$/u;

const getSearchParam = (name: string) =>
  new URLSearchParams(window.location.search).get(name);

const resetUrl = () => {
  window.history.replaceState(null, "", "/");
};

const renderHydratedTrainer = () => {
  setTableSync(
    expectedCribPointsTableData as unknown as ExpectedCribPointsTable,
  );

  return render(
    <Trainer
      generateRandomNumber={mathRandom}
      initialCards={parseHand(SIX_HEARTS_HAND)}
      initialCribRole={CribRole.Pone}
      initialDiscards={parseHand("AH,2H")}
      initialSortOrder={SortOrder.DealOrder}
      loadGoogleAnalytics={jest.fn()}
    />,
  );
};

const popStateTo = (search: string) => {
  window.history.replaceState(null, "", search);
  fireEvent.popState(window);
};

const renderTrainerSpyingOnPush = () => {
  resetUrl();
  const user = userEvent.setup();
  const pushStateSpy = jest.spyOn(window.history, "pushState");
  return { pushStateSpy, renderResult: renderTrainer(), user };
};

const expectPushesAndDiscards = (
  pushStateSpy: unknown,
  expectedPushes: number,
  expectedDiscardCount: number,
) => {
  expect(pushStateSpy).toHaveBeenCalledTimes(expectedPushes);
  expect(getSearchParam("discard")?.split(",")).toHaveLength(
    expectedDiscardCount,
  );
};

describe("trainer URL state synchronization", () => {
  it("writes the full analysis state to the URL on first render", () => {
    resetUrl();
    renderTrainer();

    expect(getSearchParam("hand")).toMatch(HAND_PARAM_PATTERN);
    expect(["dealer", "pone"]).toContain(getSearchParam("role"));
    expect(getSearchParam("sort")).toBe("descending");
  });

  it("hydrates the role for a random deal when only a role is supplied", () => {
    resetUrl();
    render(
      <Trainer
        generateRandomNumber={mathRandom}
        initialCribRole={CribRole.Pone}
        loadGoogleAnalytics={jest.fn()}
      />,
    );

    expectPoneRoleVisible();
  });

  it("hydrates role, discards, and sort order from initial props", () => {
    resetUrl();
    renderHydratedTrainer();

    expectPoneRoleVisible();

    expect(
      screen.queryByRole("columnheader", { name: calculationsHeaderName }),
    ).toBeTruthy();
    expect(screen.getByLabelText("DealOrder")).toBeChecked();
  });

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("pushes history when dealing and restores the prior hand on popstate", async () => {
    const { pushStateSpy, renderResult, user } = renderTrainerSpyingOnPush();
    try {
      const { container } = renderResult;
      const initialHandText = getHandText(container);
      const initialSearch = window.location.search;

      await clickDeal(user);

      expect(pushStateSpy).toHaveBeenCalledTimes(1);
      expect(window.location.search).not.toBe(initialSearch);

      popStateTo(initialSearch);

      expect(getHandText(container)).toBe(initialHandText);
    } finally {
      pushStateSpy.mockRestore();
    }
  });

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("pushes stable discard states and replaces transient ones", async () => {
    const { pushStateSpy, renderResult, user } = renderTrainerSpyingOnPush();
    const clickCheckbox = (index: number) =>
      user.click(renderResult.getAllByRole("checkbox")[index]!);
    try {
      await clickCheckbox(0);

      expectPushesAndDiscards(pushStateSpy, 1, 1);

      await clickCheckbox(1);

      expectPushesAndDiscards(pushStateSpy, 1, 2);

      await clickCheckbox(0);

      expectPushesAndDiscards(pushStateSpy, 2, 1);
    } finally {
      pushStateSpy.mockRestore();
    }
  });

  const expectMergedBackTo = async (
    backSpy: ReturnType<typeof jest.spyOn>,
    expectedSearch: string,
  ) => {
    expect(backSpy).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(window.location.search).toBe(expectedSearch);
    });
  };

  const withBackSpy = async (
    run: (
      backSpy: ReturnType<typeof jest.spyOn>,
      spied: ReturnType<typeof renderTrainerSpyingOnPush>,
    ) => Promise<void>,
  ) => {
    const spied = renderTrainerSpyingOnPush();
    const backSpy = jest.spyOn(window.history, "back");
    try {
      await run(backSpy, spied);
    } finally {
      backSpy.mockRestore();
      spied.pushStateSpy.mockRestore();
    }
  };

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("merges an undone discard toggle instead of duplicating the entry", () =>
    withBackSpy(async (backSpy, { pushStateSpy, renderResult, user }) => {
      const initialSearch = window.location.search;
      const firstCheckbox = renderResult.getAllByRole("checkbox")[0]!;

      await user.click(firstCheckbox);

      expect(getSearchParam("discard")).not.toBeNull();

      await user.click(firstCheckbox);

      expect(pushStateSpy).toHaveBeenCalledTimes(1);

      await expectMergedBackTo(backSpy, initialSearch);
    }));

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("merges a wandering mind change back onto the complete discard", () =>
    withBackSpy(async (backSpy, { renderResult, user }) => {
      await clickIndices(renderResult.getAllByRole, [0, 1], user);
      const completeDiscardSearch = window.location.search;

      await clickIndices(renderResult.getAllByRole, [2, 3, 3, 2], user);

      await expectMergedBackTo(backSpy, completeDiscardSearch);
    }));

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("pushes history when the sort order changes", async () => {
    const { pushStateSpy, user } = renderTrainerSpyingOnPush();
    try {
      await user.click(screen.getByLabelText("Ascending"));

      expect(pushStateSpy).toHaveBeenCalledTimes(1);
      expect(getSearchParam("sort")).toBe("ascending");
    } finally {
      pushStateSpy.mockRestore();
    }
  });

  it("restores sort order from a popstate URL without replacing the hand", () => {
    resetUrl();
    renderTrainer();
    const initialHandParam = getSearchParam("hand");

    popStateTo("?sort=ascending");

    expect(screen.getByLabelText("Ascending")).toBeChecked();
    expect(getSearchParam("hand")).toBe(initialHandParam);
  });

  it("restores the role from a popstate URL", () => {
    resetUrl();
    renderTrainer();

    popStateTo(`?hand=${SIX_HEARTS_HAND}&role=pone`);

    expectPoneRoleVisible();
  });

  it("keeps the current role when a popstate URL lacks one", () => {
    resetUrl();
    renderTrainerShowingDealerRole();

    popStateTo(`?hand=${SIX_HEARTS_HAND}`);

    expectDealerRoleVisible();
  });

  it("ignores a popstate URL with an invalid hand", () => {
    resetUrl();
    const { container } = renderTrainer();
    const initialHandText = getHandText(container);

    popStateTo("?hand=XX,YY");

    expect(getHandText(container)).toBe(initialHandText);
  });
});
