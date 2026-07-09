/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import {
  CribRole,
  type CribRole as CribRoleType,
} from "../game/expectedCribPoints";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { DECK } from "../game/Card";
import { EnterCardsDialog } from "./EnterCardsDialog";
/* jscpd:ignore-end */

const initialCards = DECK.slice(0, 6);

const renderDialog = (
  show = true,
  initialCribRole: CribRoleType = CribRole.Dealer,
) => {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  const rendered = render(
    <EnterCardsDialog
      initialCards={initialCards}
      initialCribRole={initialCribRole}
      onClose={onClose}
      onSubmit={onSubmit}
      show={show}
    />,
  );
  return { onClose, onSubmit, rendered };
};

const toggleCard = (rendered: ReturnType<typeof render>, name: string) => {
  fireEvent.click(rendered.getByRole("button", { name }));
};

const rerenderDialog = (rendered: ReturnType<typeof render>, show: boolean) => {
  rendered.rerender(
    <EnterCardsDialog
      initialCards={initialCards}
      initialCribRole={CribRole.Dealer}
      key={show ? "shown" : "hidden"}
      onClose={jest.fn()}
      onSubmit={jest.fn()}
      show={show}
    />,
  );
};

describe("enter cards dialog", () => {
  it("does not render when hidden", () => {
    const { rendered } = renderDialog(false);

    expect(rendered.queryByRole("heading", { name: "Enter cards" })).toBeNull();
  });

  it("prefills the six cards and role", () => {
    const { rendered } = renderDialog(true, CribRole.Pone);

    expect(rendered.getByText("6 of 6")).toBeInTheDocument();
    expect(rendered.getByRole("radio", { name: "Pone" })).toBeChecked();
  });

  it("disables submission when fewer than six cards are selected", () => {
    const { rendered } = renderDialog();

    toggleCard(rendered, "A♣");

    expect(rendered.getByRole("button", { name: "Analyze" })).toBeDisabled();
  });

  it("submits selected cards in pick order with the selected role", () => {
    const { onSubmit, rendered } = renderDialog();

    toggleCard(rendered, "A♣");
    toggleCard(rendered, "7♣");
    fireEvent.click(rendered.getByRole("radio", { name: "Pone" }));
    fireEvent.click(rendered.getByRole("button", { name: "Analyze" }));

    expect(onSubmit).toHaveBeenCalledWith(
      [...initialCards.slice(1), DECK[6]],
      CribRole.Pone,
    );
  });

  it("calls close without submitting", () => {
    const { onClose, onSubmit, rendered } = renderDialog();

    toggleCard(rendered, "A♣");
    fireEvent.click(rendered.getByRole("button", { name: "Close modal" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("discards abandoned edits when reopened", () => {
    const { rendered } = renderDialog();
    toggleCard(rendered, "A♣");

    rerenderDialog(rendered, false);
    rerenderDialog(rendered, true);

    expect(rendered.getByText("6 of 6")).toBeInTheDocument();
  });
});
