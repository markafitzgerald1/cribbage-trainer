/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import type {
  MistakeQueueQuantileFilter,
  MistakeQueueRoleFilter,
  MistakeQueueSortOrder,
  MistakeQueueStatusFilter,
} from "../ui/mistakeQueue";
import {
  createAllMasteredTally,
  createEmptyMistakeTally,
  createSampleMistakeTally,
} from "./MistakeQueueDialog.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { MistakeQueueDialog } from "./MistakeQueueDialog";
import type { StoredTally } from "../ui/discardTally";

const sampleTally = createSampleMistakeTally();
const allMasteredTally = createAllMasteredTally();
const emptyMistakeTally = createEmptyMistakeTally();

interface RenderDialogOptions {
  readonly initialQuantileFilter?: MistakeQueueQuantileFilter;
  readonly initialRoleFilter?: MistakeQueueRoleFilter;
  readonly initialSortOrder?: MistakeQueueSortOrder;
  readonly initialStatusFilter?: MistakeQueueStatusFilter;
  readonly onClose?: () => void;
  readonly show?: boolean;
  readonly tally?: StoredTally;
  readonly useStoredTally?: boolean;
}

const renderDialog = ({
  initialQuantileFilter = "all",
  initialRoleFilter = "all",
  initialSortOrder = "priority",
  initialStatusFilter = "active",
  onClose = jest.fn(),
  show = true,
  tally,
  useStoredTally = false,
}: RenderDialogOptions = {}) =>
  useStoredTally
    ? render(
        <MistakeQueueDialog
          initialQuantileFilter={initialQuantileFilter}
          initialRoleFilter={initialRoleFilter}
          initialSortOrder={initialSortOrder}
          initialStatusFilter={initialStatusFilter}
          onClose={onClose}
          show={show}
        />,
      )
    : render(
        <MistakeQueueDialog
          initialQuantileFilter={initialQuantileFilter}
          initialRoleFilter={initialRoleFilter}
          initialSortOrder={initialSortOrder}
          initialStatusFilter={initialStatusFilter}
          onClose={onClose}
          show={show}
          tally={tally ?? sampleTally}
        />,
      );

describe("mistake queue dialog", () => {
  describe("rendering and sorting", () => {
    it("does not render content when show is false", () => {
      const { container } = renderDialog({ show: false });

      expect(container.textContent).not.toContain("Mistake queue");
    });

    it("renders summary metrics and headings when open", () => {
      const { getAllByText, getByRole, getByText } = renderDialog();

      expect(
        getByRole("heading", { name: "Mistake queue" }),
      ).toBeInTheDocument();

      expect(getByText("Total mistakes")).toBeInTheDocument();

      expect(getByText("Needs practice")).toBeInTheDocument();

      expect(getAllByText("Mastered")).toHaveLength(2);
    });

    it("renders default radio filter selections", () => {
      const { getAllByText, getByRole } = renderDialog();

      expect(getByRole("radio", { name: "Priority" })).toBeChecked();

      expect(getByRole("radio", { name: "Active" })).toBeChecked();

      expect(getAllByText("Dealer")).toHaveLength(2);
    });

    it("renders previous discard choice when recorded", () => {
      const { getByText } = renderDialog({ initialStatusFilter: "all" });

      expect(getByText("2.50 pts lost")).toBeInTheDocument();

      expect(getByText("1.20 pts lost")).toBeInTheDocument();
    });

    it("renders fallback when previous discard choice is not recorded", () => {
      const { getByText } = renderDialog({ initialStatusFilter: "all" });

      expect(getByText("Previous choice not recorded")).toBeInTheDocument();

      expect(getByText("0.40 pts lost")).toBeInTheDocument();
    });

    it("switches sort order when selected", () => {
      const { getByRole } = renderDialog();

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
      const { getByRole, queryByText } = renderDialog();

      expect(queryByText("0.40 pts lost")).not.toBeInTheDocument();

      const masteredRadio = getByRole("radio", { name: "Mastered" });

      fireEvent.click(masteredRadio);

      expect(masteredRadio).toBeChecked();

      expect(queryByText("0.40 pts lost")).toBeInTheDocument();

      expect(queryByText("2.50 pts lost")).not.toBeInTheDocument();
    });

    it("filters by status All", () => {
      const { getByText } = renderDialog({ initialStatusFilter: "all" });

      expect(getByText("2.50 pts lost")).toBeInTheDocument();

      expect(getByText("1.20 pts lost")).toBeInTheDocument();

      expect(getByText("0.40 pts lost")).toBeInTheDocument();
    });

    it("filters by crib role Pone", () => {
      const { getByRole, queryByText } = renderDialog({
        initialStatusFilter: "all",
      });

      const poneRadio = getByRole("radio", { name: "Pone" });

      fireEvent.click(poneRadio);

      expect(poneRadio).toBeChecked();

      expect(queryByText("1.20 pts lost")).toBeInTheDocument();

      expect(queryByText("2.50 pts lost")).not.toBeInTheDocument();
    });

    it("filters by crib role Dealer", () => {
      const { getByRole, queryByText } = renderDialog({
        initialStatusFilter: "all",
      });

      const dealerRadio = getByRole("radio", { name: "Dealer" });

      fireEvent.click(dealerRadio);

      expect(dealerRadio).toBeChecked();

      expect(queryByText("2.50 pts lost")).toBeInTheDocument();

      expect(queryByText("1.20 pts lost")).not.toBeInTheDocument();
    });

    it("filters by High loss quantile", () => {
      const { getByRole, queryByText } = renderDialog({
        initialStatusFilter: "all",
      });

      const highRadio = getByRole("radio", { name: /^High severity/u });

      fireEvent.click(highRadio);

      expect(highRadio).toBeChecked();

      expect(queryByText("2.50 pts lost")).toBeInTheDocument();

      expect(queryByText("1.20 pts lost")).not.toBeInTheDocument();
    });

    it("filters by Medium loss quantile", () => {
      const { getByRole, queryByText } = renderDialog({
        initialStatusFilter: "all",
      });

      const medRadio = getByRole("radio", { name: /^Medium severity/u });

      fireEvent.click(medRadio);

      expect(medRadio).toBeChecked();

      expect(queryByText("1.20 pts lost")).toBeInTheDocument();

      expect(queryByText("2.50 pts lost")).not.toBeInTheDocument();
    });

    it("filters by Low loss quantile", () => {
      const { getByRole, queryByText } = renderDialog({
        initialStatusFilter: "all",
      });

      const lowRadio = getByRole("radio", { name: /^Low severity/u });

      fireEvent.click(lowRadio);

      expect(lowRadio).toBeChecked();

      expect(queryByText("0.40 pts lost")).toBeInTheDocument();

      expect(queryByText("2.50 pts lost")).not.toBeInTheDocument();
    });

    it("renders celebratory empty state when all mistake hands are mastered", () => {
      const { getByText } = renderDialog({
        initialStatusFilter: "active",
        tally: allMasteredTally,
      });

      expect(getByText("All mistake hands mastered!")).toBeInTheDocument();
    });

    it("renders unrecorded empty state when tally has no mistakes", () => {
      const { getByText } = renderDialog({ tally: emptyMistakeTally });

      expect(getByText(/No mistake hands recorded yet/iu)).toBeInTheDocument();
    });

    it("renders filtered empty state when filter criteria matches nothing", () => {
      const { getByText } = renderDialog({
        initialRoleFilter: "pone",
        initialStatusFilter: "mastered",
      });

      expect(
        getByText(/No mistake hands match the selected filters/iu),
      ).toBeInTheDocument();
    });

    it("renders history horizon empty state when mistakes aged out", () => {
      const agedOutTally: StoredTally = {
        lifetime: {
          decisions: 10,
          expectedPointsLossTotal: 2.0,
          optimalDecisions: 8,
          skippedHands: 0,
        },
        practice: [],
        records: [
          {
            at: 1_700_000_000_000,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 0,
            handKey: "5H,6H,7H,8H,9H,10H|Dealer",
            isOptimal: true,
            isPractice: false,
          },
        ],
        revision: 1,
        skipped: [],
        version: 4,
      };

      const { getByText } = renderDialog({ tally: agedOutTally });

      expect(
        getByText(
          /All recorded mistake hands have aged out of the recent history window/iu,
        ),
      ).toBeInTheDocument();
    });

    it("omits loss severity filter when fewer than 3 unique loss values exist", () => {
      const twoLossTally: StoredTally = {
        lifetime: {
          decisions: 2,
          expectedPointsLossTotal: 3.5,
          optimalDecisions: 0,
          skippedHands: 0,
        },
        practice: [],
        records: [
          {
            at: 1_700_000_000_000,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 2.0,
            handKey: "5H,6H,7H,8H,9H,10H|Dealer",
            isOptimal: false,
            isPractice: false,
          },
          {
            at: 1_700_000_001_000,
            cribRole: CribRole.Pone,
            discardKey: "AH,2H",
            expectedPointsLoss: 1.5,
            handKey: "AH,2H,3H,4H,5H,6H|Pone",
            isOptimal: false,
            isPractice: false,
          },
        ],
        revision: 1,
        skipped: [],
        version: 4,
      };

      const { queryByRole } = renderDialog({ tally: twoLossTally });

      expect(queryByRole("group", { name: "Loss severity" })).toBeNull();
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
        "Q",
        "K",
      ];
      const combinations = fifthCards
        .flatMap((fifth) =>
          sixthRanks.map((rank) => ({ fifth, sixth: `${rank}S` })),
        )
        .slice(0, 60);

      const records = combinations.map((combo, index) => ({
        at: 1_700_000_000_000 + index * 1000,
        cribRole: CribRole.Dealer,
        discardKey: "5C,6C",
        expectedPointsLoss: 1.0 + (index % 5) * 0.5,
        handKey: `5C,6C,7C,8C,${combo.fifth},${combo.sixth}|Dealer`,
        isOptimal: false,
        isPractice: false,
      }));

      const largeTally: StoredTally = {
        lifetime: {
          decisions: 60,
          expectedPointsLossTotal: 60 * 1.5,
          optimalDecisions: 0,
          skippedHands: 0,
        },
        practice: [],
        records,
        revision: 1,
        skipped: [],
        version: 4,
      };

      const { getByRole, queryByRole } = renderDialog({
        initialStatusFilter: "all",
        tally: largeTally,
      });

      const showMoreButton = getByRole("button", {
        name: /Show more \(10 remaining\)/u,
      });

      expect(showMoreButton).toBeInTheDocument();

      fireEvent.click(showMoreButton);

      expect(queryByRole("button", { name: /Show more/u })).toBeNull();
    });

    it("closes dialog on Escape key and close button click", () => {
      const onClose = jest.fn();
      const { getByRole } = renderDialog({ onClose });

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);

      const closeButton = getByRole("button", { name: "Close modal" });

      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("renders using readTallyForDisplay fallback when tally prop is omitted", () => {
      const { getByRole } = renderDialog({ useStoredTally: true });

      expect(
        getByRole("heading", { name: "Mistake queue" }),
      ).toBeInTheDocument();
    });
  });
});
/* jscpd:ignore-end */
