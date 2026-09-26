import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { describe, expect, it, jest } from "@jest/globals";
import Modal from "./Modal";
import { render } from "@testing-library/react";

describe("modal component", () => {
  const renderModal = (show: boolean, onClose: () => void = jest.fn()) =>
    render(
      <Modal
        onClose={onClose}
        show={show}
      >
        <div>Lorem, ipsum...</div>
      </Modal>,
    );

  it("is hidden when show is false", () => {
    const { queryByRole } = renderModal(false);

    expect(queryByRole("button")).toBeNull();
  });

  it("is shown when show is true", () => {
    const { getByRole } = renderModal(true);

    expect(getByRole("button")).toBeTruthy();
  });

  it("renders the close button with aria-label outside the scrolling body", () => {
    const { getByRole, getByText } = renderModal(true);

    const closeButton = getByRole("button", { name: "Close modal" });
    const content = getByText("Lorem, ipsum...");

    expect(closeButton).toBeInTheDocument();
    expect(content.parentElement).not.toContainElement(closeButton);
    expect(closeButton.parentElement).toContainElement(content.parentElement);
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    const { getByLabelText } = renderModal(true, onClose);

    getByLabelText("Close modal").click();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
