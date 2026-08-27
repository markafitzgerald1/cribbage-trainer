/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import {
  type MistakeQueueQuantileFilter,
  type MistakeQueueRoleFilter,
  type MistakeQueueSortOrder,
  type MistakeQueueStatusFilter,
} from "../ui/mistakeQueue";
import {
  createAllMasteredTally,
  createEmptyMistakeTally,
  createSampleMistakeTally,
} from "./MistakeQueueDialog.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
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
  readonly tally?: StoredTally | null;
  readonly useStoredTally?: boolean;
}

const renderDialog = ({
  initialQuantileFilter,
  initialRoleFilter,
  initialSortOrder,
  initialStatusFilter,
  onClose = jest.fn(),
  show = true,
  tally = sampleTally,
  useStoredTally = false,
}: RenderDialogOptions = {}) =>
  useStoredTally
    ? render(
        <MistakeQueueDialog
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
          tally={tally}
        />,
      );

describe("mistake queue dialog", () => {
  it("does not render content when show is false", () => {
    const { container } = renderDialog({ show: false });

    expect(container.textContent).not.toContain("Mistake queue");
  });

  it("renders summary metrics and headings when open", () => {
    const { getAllByText, getByRole, getByText } = renderDialog();

    expect(getByRole("heading", { name: "Mistake queue" })).toBeInTheDocument();

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

    const highRadio = getByRole("radio", { name: /^High \(/u });

    fireEvent.click(highRadio);

    expect(highRadio).toBeChecked();

    expect(queryByText("2.50 pts lost")).toBeInTheDocument();

    expect(queryByText("1.20 pts lost")).not.toBeInTheDocument();
  });

  it("filters by Medium loss quantile", () => {
    const { getByRole, queryByText } = renderDialog({
      initialStatusFilter: "all",
    });

    const medRadio = getByRole("radio", { name: /^Med \(/u });

    fireEvent.click(medRadio);

    expect(medRadio).toBeChecked();

    expect(queryByText("1.20 pts lost")).toBeInTheDocument();

    expect(queryByText("2.50 pts lost")).not.toBeInTheDocument();
  });

  it("filters by Low loss quantile", () => {
    const { getByRole, queryByText } = renderDialog({
      initialStatusFilter: "all",
    });

    const lowRadio = getByRole("radio", { name: /^Low \(/u });

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

    expect(
      getByText(/You have mastered every sub-optimal hand/iu),
    ).toBeInTheDocument();
  });

  it("renders no-matches empty state when filters exclude all hands", () => {
    const { getByRole, getByText } = renderDialog({
      initialStatusFilter: "active",
    });

    const poneRadio = getByRole("radio", { name: "Pone" });

    fireEvent.click(poneRadio);

    const lowRadio = getByRole("radio", { name: /^Low \(/u });

    fireEvent.click(lowRadio);

    expect(
      getByText("No mistake hands match the selected filters."),
    ).toBeInTheDocument();
  });

  it("renders empty tally notice when tally has no mistakes recorded", () => {
    const { getByText } = renderDialog({ tally: emptyMistakeTally });

    expect(
      getByText(/No mistake hands recorded yet. Play authentic hands/iu),
    ).toBeInTheDocument();
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

    expect(getByRole("heading", { name: "Mistake queue" })).toBeInTheDocument();
  });
});
/* jscpd:ignore-end */
