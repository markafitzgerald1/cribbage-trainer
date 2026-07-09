import "@testing-library/jest-dom";
import {
  SIX_HEARTS_HAND,
  calculationsHeaderName,
  clickDeal,
  clickIndices,
  expectDealerRoleVisible,
  expectPoneRoleVisible,
  getHandText,
  mathRandom,
  renderTrainer,
  renderTrainerShowingDealerRole,
  setCribTable,
} from "./Trainer.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { SortOrder } from "../ui/SortOrder";
import { Trainer } from "./Trainer";
import { parseHand } from "../game/Card";
import userEvent from "@testing-library/user-event";

const HAND_PARAM_PATTERN =
  /^(?:10|[A2-9JQK])[CDHS](?:,(?:10|[A2-9JQK])[CDHS]){5}$/u;

const getSearchParam = (name: string) =>
  new URLSearchParams(window.location.search).get(name);

const resetUrl = () => {
  window.history.replaceState(null, "", "/");
};

const renderHydratedTrainer = () => {
  setCribTable();

  return render(
    <Trainer
      generateRandomNumber={mathRandom}
      initialCards={parseHand(SIX_HEARTS_HAND)}
      initialCribRole={CribRole.Pone}
      initialDiscards={parseHand("AH,2H")}
      initialScoreSortKey={ScoredKeepDiscardSortKey.ExpectedHandPoints}
      initialSortOrder={SortOrder.DealOrder}
      loadGoogleAnalytics={jest.fn()}
    />,
  );
};

const findScoreHeader = (name: RegExp) =>
  screen.findByRole("columnheader", { name });

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
    expect(getSearchParam("analysis-sort")).toBe("net");
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

  it("hydrates role, discards, and sort order from initial props", async () => {
    resetUrl();
    renderHydratedTrainer();

    expectPoneRoleVisible();

    await expect(
      screen.findByRole("columnheader", { name: calculationsHeaderName }),
    ).resolves.toBeTruthy();

    expect(screen.getByLabelText("DealOrder")).toBeChecked();
  });

  it("hydrates the analysis sort column from initial props", async () => {
    resetUrl();
    renderHydratedTrainer();

    await expect(findScoreHeader(/Hand/u)).resolves.toHaveAttribute(
      "aria-sort",
      "descending",
    );

    expect(getSearchParam("analysis-sort")).toBe("hand");
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

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("does not push history for an unchanged manual hand", async () => {
    const { pushStateSpy, renderResult, user } = renderTrainerSpyingOnPush();
    try {
      await user.click(
        renderResult.getByRole("button", { name: "Enter cards" }),
      );
      await user.click(renderResult.getByRole("button", { name: "Analyze" }));

      expect(pushStateSpy).not.toHaveBeenCalled();
      expect(
        renderResult.queryByRole("heading", { name: "Enter cards" }),
      ).not.toBeInTheDocument();
    } finally {
      pushStateSpy.mockRestore();
    }
  });

  const renderDiscardedTrainerSpyingOnPush = async () => {
    const spied = renderTrainerSpyingOnPush();
    await clickIndices(spied.renderResult.getAllByRole, [0, 1], spied.user);
    return spied;
  };

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("pushes history when the analysis sort column changes", async () => {
    const { pushStateSpy, user } = await renderDiscardedTrainerSpyingOnPush();
    try {
      const cribHeaderButton = await screen.findByRole("button", {
        name: /^Crib:/u,
      });

      await user.click(cribHeaderButton);

      // The two toggles yield one push (the transient state is replaced).
      const pushesAfterCompleteDiscardAndSort = 2;

      expect(pushStateSpy).toHaveBeenCalledTimes(
        pushesAfterCompleteDiscardAndSort,
      );
      expect(getSearchParam("analysis-sort")).toBe("crib");
    } finally {
      pushStateSpy.mockRestore();
    }
  });

  it("restores the analysis sort column from a popstate URL", async () => {
    resetUrl();
    renderHydratedTrainer();
    await screen.findByRole("button", { name: /^Net:/u });

    popStateTo("?analysis-sort=net");

    await expect(findScoreHeader(/Net/u)).resolves.toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  it("refreshes an open manual-entry draft after popstate", async () => {
    resetUrl();
    const user = userEvent.setup();
    renderTrainer();
    await user.click(screen.getByRole("button", { name: "Enter cards" }));

    popStateTo(`?hand=${SIX_HEARTS_HAND}&role=pone`);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "A♥", pressed: true }),
      ).toBeEnabled();
      expect(screen.getByRole("radio", { name: "Pone" })).toBeChecked();
    });

    await user.click(screen.getByRole("button", { name: "Analyze" }));

    expect(getSearchParam("hand")).toBe(SIX_HEARTS_HAND);
    expect(getSearchParam("role")).toBe("pone");
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
