/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import * as classes from "./MistakeQueueDialog.module.css";
import {
  MistakeQueueDialog,
  type MistakeQueueDialogProps,
} from "./MistakeQueueDialog";
import {
  createAgedOutTally,
  createAllMasteredTally,
  createEmptyMistakeTally,
  createSampleMistakeTally,
  createTwoLossTally,
} from "./MistakeQueueDialog.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { SortOrder } from "../ui/SortOrder";
import type { StoredTally } from "../ui/discardTally";
import { createElement } from "react";
/* jscpd:ignore-end */

const sampleTally = createSampleMistakeTally();
const allMasteredTally = createAllMasteredTally();
const emptyMistakeTally = createEmptyMistakeTally();
const agedOutTally = createAgedOutTally();
const twoLossTally = createTwoLossTally();

interface QueueRenderConfig {
  readonly initialQuantileFilter?: MistakeQueueDialogProps["initialQuantileFilter"];
  readonly initialRoleFilter?: MistakeQueueDialogProps["initialRoleFilter"];
  readonly initialSortOrder?: MistakeQueueDialogProps["initialSortOrder"];
  readonly initialStatusFilter?: MistakeQueueDialogProps["initialStatusFilter"];
  readonly isDisplayed?: boolean;
  readonly onDismiss?: () => void;
  readonly queueTally?: StoredTally;
  readonly sortOrder?: MistakeQueueDialogProps["sortOrder"];
  readonly useStorageFallback?: boolean;
}

const renderQueueDialog = (config: QueueRenderConfig = {}) => {
  const {
    initialQuantileFilter,
    initialRoleFilter,
    initialSortOrder,
    initialStatusFilter,
    isDisplayed = true,
    onDismiss = jest.fn(),
    queueTally = sampleTally,
    sortOrder,
    useStorageFallback = false,
  } = config;

  if (useStorageFallback) {
    return render(
      <MistakeQueueDialog
        onClose={onDismiss}
        show={isDisplayed}
      />,
    );
  }

  return render(
    <MistakeQueueDialog
      initialQuantileFilter={initialQuantileFilter}
      initialRoleFilter={initialRoleFilter}
      initialSortOrder={initialSortOrder}
      initialStatusFilter={initialStatusFilter}
      onClose={onDismiss}
      show={isDisplayed}
      sortOrder={sortOrder}
      tally={queueTally}
    />,
  );
};

const testFilterSelection = ({
  absentText,
  filterName,
  presentText,
}: {
  absentText: string;
  filterName: RegExp | string;
  presentText: string;
}): boolean => {
  const { getByRole, queryByText } = renderQueueDialog({
    initialStatusFilter: "all",
  });
  const radio = getByRole("radio", { name: filterName });
  fireEvent.click(radio);

  return (
    (radio as HTMLInputElement).checked &&
    queryByText(presentText) !== null &&
    queryByText(absentText) === null
  );
};

describe("mistake queue dialog", () => {
  describe("rendering and sorting", () => {
    it("does not render content when show is false", () => {
      const { container } = renderQueueDialog({ isDisplayed: false });

      expect(container.firstChild).toBeNull();
    });

    it("renders summary metrics and headings when open", () => {
      const rendered = renderQueueDialog();

      expect(rendered.getByRole("heading", { level: 2 }).textContent).toBe(
        "Mistake queue",
      );

      expect(rendered.getByText("Total mistakes")).toBeInTheDocument();

      expect(rendered.getByText("Needs practice")).toBeInTheDocument();

      expect(rendered.getAllByText("Mastered")).toHaveLength(2);
    });

    it("renders default radio filter selections", () => {
      const { getAllByText, getByRole } = renderQueueDialog();

      expect(getByRole("radio", { name: "Priority" })).toBeChecked();

      expect(getByRole("radio", { name: "Active" })).toBeChecked();

      expect(getAllByText("Dealer")).toHaveLength(2);
    });

    it("renders previous discard choice when recorded", () => {
      const { queryByText } = renderQueueDialog({ initialStatusFilter: "all" });

      expect(queryByText("2.50 pts lost")).not.toBeNull();
      expect(queryByText("1.20 pts lost")).not.toBeNull();
    });

    it("renders fallback when previous discard choice is not recorded", () => {
      const rendered = renderQueueDialog({ initialStatusFilter: "all" });

      expect(
        rendered.getByText("Previous choice not recorded"),
      ).toBeInTheDocument();
      expect(rendered.getByText("0.40 pts lost")).toBeInTheDocument();
    });

    it("switches sort order when selected", () => {
      const { getByRole } = renderQueueDialog();

      const highestLossRadio = getByRole("radio", { name: "Highest loss" });

      fireEvent.click(highestLossRadio);

      expect(highestLossRadio).toBeChecked();

      const mostRecentRadio = getByRole("radio", { name: "Most recent" });

      fireEvent.click(mostRecentRadio);

      expect(mostRecentRadio).toBeChecked();

      const priorityRadio = getByRole("radio", { name: "Priority" });

      fireEvent.click(priorityRadio);

      expect(priorityRadio).toBeChecked();
    });
  });

  describe("filtering, pagination, and dismissal", () => {
    it("filters by status Active and Mastered", () => {
      const { getByRole, queryByText } = renderQueueDialog();

      expect(queryByText("0.40 pts lost")).not.toBeInTheDocument();

      const masteredRadio = getByRole("radio", { name: "Mastered" });

      fireEvent.click(masteredRadio);

      expect(masteredRadio).toBeChecked();

      expect(queryByText("0.40 pts lost")).toBeInTheDocument();

      expect(queryByText("2.50 pts lost")).not.toBeInTheDocument();
    });

    it("filters by status All", () => {
      const view = renderQueueDialog({ initialStatusFilter: "all" });

      expect(view.getAllByText(/pts lost/u)).toHaveLength(3);
    });

    it.each([
      {
        absentText: "2.50 pts lost",
        filterName: "Pone",
        presentText: "1.20 pts lost",
      },
      {
        absentText: "1.20 pts lost",
        filterName: "Dealer",
        presentText: "2.50 pts lost",
      },
      {
        absentText: "1.20 pts lost",
        filterName: /^High severity/u,
        presentText: "2.50 pts lost",
      },
      {
        absentText: "2.50 pts lost",
        filterName: /^Medium severity/u,
        presentText: "1.20 pts lost",
      },
      {
        absentText: "2.50 pts lost",
        filterName: /^Low severity/u,
        presentText: "0.40 pts lost",
      },
    ])("filters by $filterName", ({ absentText, filterName, presentText }) => {
      expect(testFilterSelection({ absentText, filterName, presentText })).toBe(
        true,
      );
    });

    it("renders celebratory empty state when all mistake hands are mastered", () => {
      const { getByText } = renderQueueDialog({
        initialStatusFilter: "active",
        queueTally: allMasteredTally,
      });

      expect(getByText("All mistake hands mastered!")).toBeInTheDocument();
    });

    it("renders unrecorded empty state when tally has no mistakes", () => {
      const { getByText } = renderQueueDialog({
        queueTally: emptyMistakeTally,
      });

      expect(getByText(/No mistake hands recorded yet/iu)).toBeInTheDocument();
    });

    it("renders filtered empty state when filter criteria matches nothing", () => {
      const { getByText } = renderQueueDialog({
        initialRoleFilter: "pone",
        initialStatusFilter: "mastered",
      });

      expect(
        getByText(/No mistake hands match the selected filters/iu),
      ).toBeInTheDocument();
    });

    it("renders history horizon empty state when mistakes aged out", () => {
      const { getByText } = renderQueueDialog({ queueTally: agedOutTally });

      expect(
        getByText(
          /All recorded mistake hands have aged out of the recent history window/iu,
        ),
      ).toBeInTheDocument();
    });

    it("omits loss severity filter and clamps initial quantile filter when fewer than 3 unique loss values exist", () => {
      const rendered = renderQueueDialog({
        initialQuantileFilter: "high",
        queueTally: twoLossTally,
      });

      expect(
        rendered.queryByRole("group", { name: "Loss severity" }),
      ).toBeNull();
      expect([
        rendered.queryByText("low"),
        rendered.queryByText("medium"),
        rendered.queryByText("high"),
      ]).toStrictEqual([null, null, null]);
      expect(rendered.getByText("2.00 pts lost")).toBeInTheDocument();
      expect(rendered.getByText("1.50 pts lost")).toBeInTheDocument();
    });

    it("paginates list and renders more items when Show more is clicked", () => {
      const fifthCards = ["9C", "10C", "JC", "QC", "KC"];
      const sixthRanks = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
      ];
      const records = [];
      let index = 0;

      for (const fifth of fifthCards) {
        for (const sixth of sixthRanks) {
          index += 1;
          records.push({
            at: 1_700_000_000_000 + index * 1000,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 1.0 + (index % 5) * 0.5,
            handKey: `5H,6H,7H,8H,${fifth},${sixth}S|Dealer`,
            isOptimal: false,
            isPractice: false,
          });
        }
      }

      const largeTally = {
        lifetime: {
          decisions: records.length,
          expectedPointsLossTotal: 100,
          optimalDecisions: 0,
          skippedHands: 0,
        },
        practice: [],
        records,
        revision: 1,
        skipped: [],
        version: 5,
      };

      const { getByRole, queryByRole } = renderQueueDialog({
        initialStatusFilter: "all",
        queueTally: largeTally,
      });

      const showMoreButton = getByRole("button", {
        name: /Show more \(5 remaining\)/iu,
      });

      expect(showMoreButton).toBeInTheDocument();

      fireEvent.click(showMoreButton);

      expect(
        queryByRole("button", { name: /Show more/iu }),
      ).not.toBeInTheDocument();
    });

    it("handles close button click to trigger onClose", () => {
      const handleClose = jest.fn();
      const { getByRole } = renderQueueDialog({ onDismiss: handleClose });

      fireEvent.click(getByRole("button", { name: "Close modal" }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("renders using readTallyForDisplay fallback when tally prop is omitted", () => {
      const fallbackView = renderQueueDialog({ useStorageFallback: true });

      expect(
        fallbackView.getByRole("region", { name: "Mistake queue" }),
      ).toBeInTheDocument();
    });

    it.each([
      {
        expectedCards: "10♥9♥8♥7♥6♥5♥",
        expectedDiscard: "Previous discard:6♥5♥",
        name: "descending",
        sortOrder: SortOrder.Descending,
      },
      {
        expectedCards: "5♥6♥7♥8♥9♥10♥",
        expectedDiscard: "Previous discard:5♥6♥",
        name: "ascending",
        sortOrder: SortOrder.Ascending,
      },
    ])(
      "renders hand cards and discards in $name order",
      ({ expectedCards, expectedDiscard, sortOrder }) => {
        const { container } = renderQueueDialog({ sortOrder });

        expect(
          container.querySelector(`.${classes.cardsRow}`),
        ).toHaveTextContent(expectedCards);
        expect(
          container.querySelector(`.${classes.previousDiscard}`),
        ).toHaveTextContent(expectedDiscard);
      },
    );

    it("renders using readTallyForDisplay fallback when tally prop is null", () => {
      const nullTallyView = render(
        createElement(MistakeQueueDialog, {
          onClose: jest.fn(),
          show: true,
          tally: null,
        }),
      );

      expect(
        nullTallyView.getByRole("region", { name: "Mistake queue" }),
      ).toBeInTheDocument();
    });
  });
});
