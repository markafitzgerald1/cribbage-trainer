import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { describe, expect, it, jest } from "@jest/globals";
import Modal from "./Modal";
import { render } from "@testing-library/react";

describe("modal component", () => {
  const renderModal = (show: boolean) =>
    render(
      <Modal
        onClose={jest.fn()}
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

    expect(getByRole("button")).toBeInTheDocument();
  });
});
